using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BusSolutionApi.Data;
using BusSolutionApi.Services;
using Npgsql;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

static string NormalizeConnectionString(string value)
{
    var isUri = value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

    if (!isUri)
    {
        return value;
    }

    // Managed Postgres providers (Render, Neon, Heroku-style) hand out a
    // postgres:// URI, but Npgsql expects a keyword=value connection string.
    var uri = new Uri(value);
    var userInfo = uri.UserInfo.Split(':', 2);

    var connectionStringBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Database = uri.AbsolutePath.TrimStart('/'),
        Username = Uri.UnescapeDataString(userInfo[0]),
        Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
        SslMode = SslMode.Require
    };

    return connectionStringBuilder.ConnectionString;
}

// Secrets: prefer environment variables, fall back to appsettings (dev only)
// Production must set: ConnectionStrings__DefaultConnection, Jwt__Key
var connStr = NormalizeConnectionString(builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings__DefaultConnection is not set."));
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt__Key is not set.");

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connStr));

// JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("DriverOnly", policy => policy.RequireRole("Driver"));
});

// Email
var emailSettings = builder.Configuration.GetSection("Email").Get<EmailSettings>() ?? new EmailSettings();
builder.Services.AddSingleton(emailSettings);
builder.Services.AddScoped<EmailService>();

// SMS (driver credential delivery)
var twilioSettings = builder.Configuration.GetSection("Twilio").Get<TwilioSettings>() ?? new TwilioSettings();
builder.Services.AddSingleton(twilioSettings);
builder.Services.AddSingleton<ISmsService, TwilioSmsService>();
builder.Services.AddScoped<DriverCredentialService>();

// CORS — allowed origins are configurable via Cors:AllowedOrigins (env: Cors__AllowedOrigins__0, etc.)
// so new deploy targets (e.g. a Cloudflare Workers URL) can be added without a code change.
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
        [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5179",
            "https://kjosavikreiser.no",
            "https://www.kjosavikreiser.no"
        ];

        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    }));

builder.Services.AddControllers();

// Rate limiting — 10 requests per minute per IP on public booking endpoints
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("booking", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));
    options.RejectionStatusCode = 429;
});

var app = builder.Build();

// Run migrations and seed on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db, app.Configuration);
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseRateLimiter();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", utc = DateTime.UtcNow }));

app.Run();
