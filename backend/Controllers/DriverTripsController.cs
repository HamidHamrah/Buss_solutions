using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;
using BusSolutionApi.Services;
using System.Security.Claims;

namespace BusSolutionApi.Controllers;

[Authorize(Policy = "DriverOnly")]
[ApiController]
[Route("api/driver/trips")]
public class DriverTripsController(AppDbContext db, EmailService email, ISmsService sms) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMyTrips()
    {
        var driverId = GetDriverId();
        var today = DateTime.UtcNow.Date;

        var trips = await db.BusAssignments
            .Where(a => a.DriverId == driverId && a.Type == "trip" && a.Status != TripStatus.Cancelled)
            .Where(a => a.EndDate >= today)
            .OrderBy(a => a.StartDate).ThenBy(a => a.StartTime)
            .ToListAsync();

        var buses = await BusLookupAsync(trips.Select(t => t.BusId));
        return Ok(trips.Select(t => ToSummaryDto(t, buses)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTrip(int id)
    {
        var driverId = GetDriverId();
        var trip = await db.BusAssignments
            .Include(a => a.Stops.OrderBy(s => s.SequenceNumber))
            .Include(a => a.LogEntries.OrderBy(l => l.CreatedAt))
            .FirstOrDefaultAsync(a => a.Id == id);

        if (trip == null) return NotFound();
        if (trip.DriverId != driverId) return Forbid();

        var buses = await BusLookupAsync([trip.BusId]);
        return Ok(ToDetailDto(trip, buses));
    }

    [HttpPost("{id}/start")]
    public async Task<IActionResult> Start(int id)
    {
        var trip = await db.BusAssignments
            .Include(a => a.Booking)
            .FirstOrDefaultAsync(a => a.Id == id && a.DriverId == GetDriverId());
        if (trip is null) return NotFound();
        if (trip.Status != TripStatus.Planned)
            return BadRequest(new { message = "Turen er allerede startet eller avsluttet." });

        trip.Status = TripStatus.InProgress;
        trip.StartedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Send tracking link to customer by both SMS and email
        var booking = trip.Booking;
        if (booking != null)
        {
            var cfg = await db.SiteConfigs.OrderBy(c => c.Id).FirstOrDefaultAsync();
            var domain = cfg?.SiteDomain ?? "";
            var scheme = domain.Contains("localhost") ? "http" : "https";
            var trackingUrl = string.IsNullOrWhiteSpace(domain)
                ? $"/sporing/{trip.TrackingToken}"
                : $"{scheme}://{domain}/sporing/{trip.TrackingToken}";

            // SMS — immediate, short link
            if (!string.IsNullOrWhiteSpace(booking.ContactPhone))
            {
                var smsText = $"Hei {booking.ContactName?.Split(' ')[0] ?? ""}! " +
                    $"Bussen din er nå på vei. Følg posisjonen live her: {trackingUrl}";
                _ = sms.SendAsync(booking.ContactPhone, smsText);
            }

            // Email — richer format with button
            if (!string.IsNullOrWhiteSpace(booking.ContactEmail))
            {
                await email.SendTripStartedAsync(
                    booking.ContactEmail,
                    booking.ContactName ?? "Kunde",
                    trip.TrackingToken,
                    trip.Title,
                    booking.FromAddress,
                    booking.ToAddress,
                    trip.StartTime?.ToString("HH:mm"));
            }
        }

        return Ok(new { trip.Status, trip.StartedAt });
    }

    [HttpPost("{id}/finish")]
    public async Task<IActionResult> Finish(int id)
    {
        var trip = await GetOwnedTripAsync(id);
        if (trip is null) return NotFound();
        if (trip.Status != TripStatus.InProgress)
            return BadRequest(new { message = "Turen er ikke startet." });

        trip.Status = TripStatus.Completed;
        trip.FinishedAt = DateTime.UtcNow;
        // Clear the live position — a finished trip shouldn't leave a stale pin on the map.
        trip.CurrentLatitude = null;
        trip.CurrentLongitude = null;
        trip.PositionUpdatedAt = null;
        await db.SaveChangesAsync();
        return Ok(new { trip.Status, trip.FinishedAt });
    }

    // Only accepted while the trip is actually in progress — this is the boundary that keeps
    // tracking scoped to an active job instead of running continuously.
    [HttpPost("{id}/location")]
    public async Task<IActionResult> ReportLocation(int id, [FromBody] LocationRequest req)
    {
        var trip = await GetOwnedTripAsync(id);
        if (trip is null) return NotFound();
        if (trip.Status != TripStatus.InProgress)
            return BadRequest(new { message = "Posisjon kan bare deles mens turen pågår." });

        var now = DateTime.UtcNow;
        trip.CurrentLatitude = req.Latitude;
        trip.CurrentLongitude = req.Longitude;
        trip.PositionUpdatedAt = now;
        db.BusPositionPings.Add(new BusPositionPing
        {
            BusAssignmentId = trip.Id,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            RecordedAt = now,
        });
        await db.SaveChangesAsync();
        return Ok(new { trip.PositionUpdatedAt });
    }

    [HttpPost("{id}/stops/{stopId}/arrive")]
    public async Task<IActionResult> Arrive(int id, int stopId)
    {
        var stop = await GetOwnedStopAsync(id, stopId);
        if (stop is null) return NotFound();
        stop.ActualArrival = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { stop.ActualArrival });
    }

    [HttpPost("{id}/stops/{stopId}/depart")]
    public async Task<IActionResult> Depart(int id, int stopId)
    {
        var stop = await GetOwnedStopAsync(id, stopId);
        if (stop is null) return NotFound();
        stop.ActualDeparture = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { stop.ActualDeparture });
    }

    [HttpPost("{id}/notes")]
    public async Task<IActionResult> AddTripNote(int id, [FromBody] TripNoteRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Message)) return BadRequest(new { message = "Melding kan ikke være tom." });
        var trip = await GetOwnedTripAsync(id);
        if (trip is null) return NotFound();

        var entry = new TripLogEntry
        {
            BusAssignmentId = trip.Id,
            TripStopId = null,
            Message = req.Message.Trim(),
            CreatedByDriverId = GetDriverId(),
        };
        db.TripLogEntries.Add(entry);
        await db.SaveChangesAsync();
        return Ok(ToLogDto(entry));
    }

    [HttpPost("{id}/stops/{stopId}/notes")]
    public async Task<IActionResult> AddStopNote(int id, int stopId, [FromBody] TripNoteRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Message)) return BadRequest(new { message = "Melding kan ikke være tom." });
        var stop = await GetOwnedStopAsync(id, stopId);
        if (stop is null) return NotFound();

        var entry = new TripLogEntry
        {
            BusAssignmentId = id,
            TripStopId = stop.Id,
            Message = req.Message.Trim(),
            CreatedByDriverId = GetDriverId(),
        };
        db.TripLogEntries.Add(entry);
        await db.SaveChangesAsync();
        return Ok(ToLogDto(entry));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private int GetDriverId() =>
        int.Parse(User.FindFirstValue("driverId") ?? throw new InvalidOperationException("Missing driverId claim"));

    private async Task<BusAssignment?> GetOwnedTripAsync(int id)
    {
        var driverId = GetDriverId();
        var trip = await db.BusAssignments.FindAsync(id);
        return trip != null && trip.DriverId == driverId ? trip : null;
    }

    private async Task<TripStop?> GetOwnedStopAsync(int tripId, int stopId)
    {
        var driverId = GetDriverId();
        var stop = await db.TripStops.Include(s => s.BusAssignment).FirstOrDefaultAsync(s => s.Id == stopId && s.BusAssignmentId == tripId);
        return stop != null && stop.BusAssignment?.DriverId == driverId ? stop : null;
    }

    // Grouped rather than a straight ToDictionary — ExternalId isn't enforced unique at the
    // DB level, and this endpoint shouldn't 500 just because a duplicate exists.
    private async Task<Dictionary<string, Bus>> BusLookupAsync(IEnumerable<string> busIds)
    {
        var buses = await db.Buses.Where(b => busIds.Contains(b.ExternalId)).ToListAsync();
        return buses.GroupBy(b => b.ExternalId).ToDictionary(g => g.Key, g => g.First());
    }

    private static object ToSummaryDto(BusAssignment a, Dictionary<string, Bus> buses)
    {
        buses.TryGetValue(a.BusId, out var bus);
        return new
        {
            a.Id,
            a.StartDate,
            a.EndDate,
            startTime = a.StartTime?.ToString("HH:mm"),
            endTime = a.EndTime?.ToString("HH:mm"),
            a.Title,
            a.Status,
            busName = bus?.Name,
            busRegistrationNumber = bus?.RegistrationNumber,
        };
    }

    private static object ToDetailDto(BusAssignment a, Dictionary<string, Bus> buses)
    {
        buses.TryGetValue(a.BusId, out var bus);
        return new
        {
            a.Id,
            a.StartDate,
            a.EndDate,
            startTime = a.StartTime?.ToString("HH:mm"),
            endTime = a.EndTime?.ToString("HH:mm"),
            a.Title,
            a.Notes,
            a.Status,
            a.StartedAt,
            a.FinishedAt,
            a.CurrentLatitude,
            a.CurrentLongitude,
            a.PositionUpdatedAt,
            busName = bus?.Name,
            busRegistrationNumber = bus?.RegistrationNumber,
            stops = a.Stops.Select(s => new
            {
                s.Id,
                s.SequenceNumber,
                s.Kind,
                s.Name,
                s.Description,
                s.Latitude,
                s.Longitude,
                s.PlannedTime,
                s.ActualArrival,
                s.ActualDeparture,
                notes = a.LogEntries.Where(l => l.TripStopId == s.Id).Select(ToLogDto),
            }),
            tripNotes = a.LogEntries.Where(l => l.TripStopId == null).Select(ToLogDto),
        };
    }

    private static object ToLogDto(TripLogEntry l) => new { l.Id, l.Message, l.CreatedAt, l.TripStopId };
}

public record TripNoteRequest(string Message);
public record LocationRequest(double Latitude, double Longitude);
