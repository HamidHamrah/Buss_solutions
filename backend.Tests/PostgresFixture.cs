using BusSolutionApi.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace BusSolutionApi.Tests;

// Database tests run against a real, throwaway Postgres database (the invoice numbering relies on
// Postgres-only behaviour, so EF's InMemory provider is not representative). Set TEST_PG to a
// connection string that may create databases, e.g.
//   TEST_PG="Host=localhost;Username=postgres;Password=postgres;Database=postgres"
// Without it, these tests are skipped.
public sealed class PostgresFixture : IAsyncLifetime
{
    private static readonly string? Admin = Environment.GetEnvironmentVariable("TEST_PG");
    private readonly string _dbName = $"bus_test_{Guid.NewGuid():N}";

    public bool Available => !string.IsNullOrWhiteSpace(Admin);

    public AppDbContext NewContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString())
            .AddInterceptors(new BusSolutionApi.Infrastructure.AuditSaveChangesInterceptor(new Microsoft.AspNetCore.Http.HttpContextAccessor()))
            .Options);

    private string ConnectionString() => new NpgsqlConnectionStringBuilder(Admin!) { Database = _dbName }.ToString();

    public async Task InitializeAsync()
    {
        if (!Available) return;
        await using (var admin = new NpgsqlConnection(Admin))
        {
            await admin.OpenAsync();
            await using var cmd = new NpgsqlCommand($"CREATE DATABASE \"{_dbName}\"", admin);
            await cmd.ExecuteNonQueryAsync();
        }
        await using var db = NewContext();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        if (!Available) return;
        NpgsqlConnection.ClearAllPools();
        await using var admin = new NpgsqlConnection(Admin);
        await admin.OpenAsync();
        await using var cmd = new NpgsqlCommand($"DROP DATABASE IF EXISTS \"{_dbName}\" WITH (FORCE)", admin);
        await cmd.ExecuteNonQueryAsync();
    }
}

public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("TEST_PG")))
            Skip = "Set TEST_PG to run database tests.";
    }
}
