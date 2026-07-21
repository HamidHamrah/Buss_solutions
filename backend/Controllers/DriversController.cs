using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;
using BusSolutionApi.Services;

namespace BusSolutionApi.Controllers;

[Authorize(Policy = "AdminOnly")]
[ApiController]
[Route("api/drivers")]
public class DriversController(AppDbContext db, DriverCredentialService credentialService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var drivers = await db.Drivers.OrderBy(d => d.FirstName).ThenBy(d => d.LastName).ToListAsync();
        return Ok(drivers.Select(ToDto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DriverRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FirstName))
            return BadRequest(new { error = "Fornavn er påkrevd." });
        if (string.IsNullOrWhiteSpace(req.LastName))
            return BadRequest(new { error = "Etternavn er påkrevd." });
        if (string.IsNullOrWhiteSpace(req.Phone))
            return BadRequest(new { error = "Telefonnummer er påkrevd." });

        var phone = req.Phone.Trim();
        if (await db.Drivers.AnyAsync(d => d.Phone == phone))
            return Conflict(new { error = "Telefonnummeret er allerede i bruk av en annen sjåfør." });

        var driver = new Driver
        {
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            Phone = phone,
            Email = req.Email?.Trim() ?? "",
            Notes = req.Notes?.Trim() ?? "",
            Color = req.Color ?? "#3b82f6",
            Active = req.Active ?? true,
        };

        await credentialService.IssueCredentialsAsync(driver);

        db.Drivers.Add(driver);
        await db.SaveChangesAsync();
        return Ok(ToDto(driver));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] DriverRequest req)
    {
        var driver = await db.Drivers.FindAsync(id);
        if (driver == null) return NotFound();

        var newPhone = req.Phone?.Trim() ?? driver.Phone;
        if (newPhone != driver.Phone && await db.Drivers.AnyAsync(d => d.Id != id && d.Phone == newPhone))
            return Conflict(new { error = "Telefonnummeret er allerede i bruk av en annen sjåfør." });

        driver.FirstName = req.FirstName?.Trim() ?? driver.FirstName;
        driver.LastName = req.LastName?.Trim() ?? driver.LastName;
        driver.Phone = newPhone;
        driver.Email = req.Email?.Trim() ?? driver.Email;
        driver.Notes = req.Notes?.Trim() ?? driver.Notes;
        driver.Color = req.Color ?? driver.Color;
        if (req.Active.HasValue) driver.Active = req.Active.Value;

        await db.SaveChangesAsync();
        return Ok(ToDto(driver));
    }

    // Regenerates the password and texts it again (with their phone number as a reminder
    // of how to log in) — for a lost password or a driver who never received the original SMS.
    [HttpPost("{id}/resend-credentials")]
    public async Task<IActionResult> ResendCredentials(int id)
    {
        var driver = await db.Drivers.FindAsync(id);
        if (driver == null) return NotFound();

        await credentialService.IssueCredentialsAsync(driver);
        await db.SaveChangesAsync();
        return Ok(ToDto(driver));
    }

    // Promotes or demotes a driver's admin access. Guards against removing the very
    // last admin, which would lock everyone out of the admin panel.
    [HttpPut("{id}/role")]
    public async Task<IActionResult> SetRole(int id, [FromBody] DriverRoleRequest req)
    {
        var driver = await db.Drivers.FindAsync(id);
        if (driver == null) return NotFound();

        if (driver.IsAdmin && !req.IsAdmin)
        {
            var otherAdmins = await db.Drivers.CountAsync(d => d.Id != id && d.IsAdmin);
            if (otherAdmins == 0)
                return BadRequest(new { error = "Kan ikke fjerne admin-tilgangen til den siste administratoren." });
        }

        driver.IsAdmin = req.IsAdmin;
        await db.SaveChangesAsync();
        return Ok(ToDto(driver));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var driver = await db.Drivers.FindAsync(id);
        if (driver == null) return NotFound();
        db.Drivers.Remove(driver);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static object ToDto(Driver d) => new
    {
        d.Id,
        d.FirstName,
        d.LastName,
        fullName = d.FullName,
        d.Phone,
        d.Email,
        d.Notes,
        d.Active,
        d.Color,
        d.IsAdmin,
        d.MustChangePassword,
        d.LastLoginAt,
        d.CreatedAt,
    };
}

public record DriverRequest(string? FirstName, string? LastName, string? Phone, string? Email, string? Notes, string? Color, bool? Active);
public record DriverRoleRequest(bool IsAdmin);
