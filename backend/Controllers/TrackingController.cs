using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/track")]
public class TrackingController(AppDbContext db) : ControllerBase
{
    // Public — no auth. Token is a random UUID so it can't be guessed.
    [HttpGet("{token}")]
    public async Task<IActionResult> GetByToken(string token)
    {
        var a = await db.BusAssignments
            .Include(a => a.Driver)
            .Include(a => a.Booking)
            .FirstOrDefaultAsync(a => a.TrackingToken == token);

        if (a is null) return NotFound(new { error = "Ugyldig sporingslenke." });

        return Ok(new
        {
            id           = a.Id,
            status       = a.Status,
            title        = a.Title,
            startDate    = a.StartDate,
            startTime    = a.StartTime?.ToString("HH:mm"),
            endDate      = a.EndDate,
            endTime      = a.EndTime?.ToString("HH:mm"),
            fromAddress  = a.Booking?.FromAddress,
            toAddress    = a.Booking?.ToAddress,
            driverName   = a.Driver != null ? a.Driver.FirstName : null,
            busName      = a.Booking?.BusName,
            latitude     = a.CurrentLatitude,
            longitude    = a.CurrentLongitude,
            positionUpdatedAt = a.PositionUpdatedAt,
        });
    }
}
