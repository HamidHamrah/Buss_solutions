using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BusSolutionApi.Data;
using BusSolutionApi.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/admin")]
public class AuthController(AppDbContext db, IConfiguration config, LoginThrottle throttle, AuditService audit) : ControllerBase
{
    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var key = $"admin:{HttpContext.Connection.RemoteIpAddress}";
        if (throttle.RemainingLockout(key) is { } left)
        {
            Response.Headers.RetryAfter = ((int)left.TotalSeconds).ToString();
            return StatusCode(429, new { message = $"For mange mislykkede forsøk. Prøv igjen om {(int)Math.Ceiling(left.TotalMinutes)} minutter." });
        }

        var cfg = await db.SiteConfigs.FirstOrDefaultAsync();
        if (cfg == null) return StatusCode(500);

        if (!BCrypt.Net.BCrypt.Verify(req.Password, cfg.AdminPasswordHash))
        {
            throttle.RecordFailure(key);
            await audit.RecordAsync("login_failed", "Admin", null, "Mislykket admin-innlogging", "Anonym");
            return Unauthorized(new { message = "Feil passord" });
        }
        throttle.RecordSuccess(key);
        await audit.RecordAsync("login", "Admin", null, "Admin logget inn", "Admin");

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: [new Claim(ClaimTypes.Role, "Admin")],
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
        );

        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
    }
}

public record LoginRequest(string Password);
