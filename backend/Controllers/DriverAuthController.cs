using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BusSolutionApi.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/driver")]
public class DriverAuthController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] DriverLoginRequest req)
    {
        var phone = req.Phone?.Trim() ?? "";
        var driver = await db.Drivers.FirstOrDefaultAsync(d => d.Phone == phone);
        if (driver == null || !driver.Active || !BCrypt.Net.BCrypt.Verify(req.Password, driver.PasswordHash))
            return Unauthorized(new { message = "Feil telefonnummer eller passord" });

        driver.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var token = IssueToken(driver.Id, driver.IsAdmin);
        return Ok(new
        {
            token,
            mustChangePassword = driver.MustChangePassword,
            isAdmin = driver.IsAdmin,
            driver = new { driver.Id, driver.FirstName, driver.LastName, fullName = driver.FullName },
        });
    }

    // A driver can only ever see their own profile — never the full driver list
    // (that's admin-only, via GET /api/drivers).
    [Authorize(Policy = "DriverOnly")]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var driver = await db.Drivers.FindAsync(GetDriverId());
        if (driver == null) return NotFound();

        return Ok(new
        {
            driver.Id, driver.FirstName, driver.LastName, fullName = driver.FullName,
            driver.Phone, driver.Email,
        });
    }

    [Authorize(Policy = "DriverOnly")]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] DriverChangePasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 8)
            return BadRequest(new { message = "Passord må være minst 8 tegn" });

        var driverId = GetDriverId();
        var driver = await db.Drivers.FindAsync(driverId);
        if (driver == null) return NotFound();

        driver.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        driver.MustChangePassword = false;
        await db.SaveChangesAsync();
        return Ok();
    }

    private int GetDriverId() =>
        int.Parse(User.FindFirstValue("driverId") ?? throw new InvalidOperationException("Missing driverId claim"));

    // Everyone gets the Driver role (so their own /api/driver/* endpoints keep working);
    // admins additionally get the Admin role, so one login grants both panels at once.
    private string IssueToken(int driverId, bool isAdmin)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "Driver"),
            new("driverId", driverId.ToString()),
        };
        if (isAdmin) claims.Add(new Claim(ClaimTypes.Role, "Admin"));

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(16),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record DriverLoginRequest(string Phone, string Password);
public record DriverChangePasswordRequest(string NewPassword);
