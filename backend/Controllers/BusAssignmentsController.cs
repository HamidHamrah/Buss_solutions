using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[Authorize(Policy = "AdminOnly")]
[ApiController]
[Route("api/assignments")]
public class BusAssignmentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? year, [FromQuery] int? month,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] TripStatus? status,
        [FromQuery] int? bookingId, [FromQuery] string? search)
    {
        var query = db.BusAssignments
            .Include(a => a.Driver)
            .Include(a => a.Booking)
            .Include(a => a.Stops)
            .AsQueryable();

        if (year.HasValue && month.HasValue)
        {
            var monthFrom = DateTime.SpecifyKind(new DateTime(year.Value, month.Value, 1), DateTimeKind.Utc);
            var monthTo = monthFrom.AddMonths(1);
            query = query.Where(a => a.StartDate < monthTo && a.EndDate >= monthFrom);
        }

        if (from.HasValue)
        {
            var utcFrom = DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.EndDate >= utcFrom);
        }
        if (to.HasValue)
        {
            var utcTo = DateTime.SpecifyKind(to.Value.Date, DateTimeKind.Utc).AddDays(1);
            query = query.Where(a => a.StartDate < utcTo);
        }

        if (status.HasValue)
            query = query.Where(a => a.Status == status);

        if (bookingId.HasValue)
            query = query.Where(a => a.BookingId == bookingId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(a =>
                a.Id.ToString().Contains(term) ||
                a.Title.ToLower().Contains(term) ||
                (a.BookingReference != null && a.BookingReference.ToLower().Contains(term)) ||
                (a.Driver != null && (a.Driver.FirstName + " " + a.Driver.LastName).ToLower().Contains(term)));
        }

        var items = await query.OrderBy(a => a.StartDate).ThenBy(a => a.StartTime).ToListAsync();

        var busIds = items.Select(a => a.BusId).Distinct().ToList();
        var busNames = await db.Buses.Where(b => busIds.Contains(b.ExternalId)).ToDictionaryAsync(b => b.ExternalId, b => b.Name);

        return Ok(items.Select(a => ToDto(a, busNames)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var assignment = await db.BusAssignments
            .Include(a => a.Driver)
            .Include(a => a.Stops.OrderBy(s => s.SequenceNumber))
            .Include(a => a.LogEntries.OrderBy(l => l.CreatedAt))
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null) return NotFound();
        return Ok(ToDetailDto(assignment));
    }

    // The full history of logged GPS pings for a trip — the actual path driven, as opposed
    // to CurrentLatitude/Longitude which only ever holds the latest point.
    [HttpGet("{id}/position-history")]
    public async Task<IActionResult> GetPositionHistory(int id)
    {
        var exists = await db.BusAssignments.AnyAsync(a => a.Id == id);
        if (!exists) return NotFound();

        var pings = await db.BusPositionPings
            .Where(p => p.BusAssignmentId == id)
            .OrderBy(p => p.RecordedAt)
            .Select(p => new { p.Latitude, p.Longitude, p.RecordedAt })
            .ToListAsync();

        return Ok(pings);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssignmentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.BusId))
            return BadRequest(new { error = "BusId er påkrevd." });
        if (req.EndDate < req.StartDate)
            return BadRequest(new { error = "Sluttdato må være etter startdato." });

        var conflict = await FindConflictAsync(req.BusId, req.DriverId, req.StartDate, req.EndDate, req.StartTime, req.EndTime, excludeId: null);
        if (conflict != null)
            return Conflict(new { error = conflict });

        var assignment = new BusAssignment
        {
            BusId = req.BusId,
            DriverId = req.DriverId,
            BookingId = req.BookingId,
            StartDate = DateTime.SpecifyKind(req.StartDate.Date, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(req.EndDate.Date, DateTimeKind.Utc),
            StartTime = ParseTime(req.StartTime),
            EndTime = ParseTime(req.EndTime),
            Title = req.Title?.Trim() ?? "",
            Type = req.Type ?? "trip",
            Notes = req.Notes?.Trim(),
            BookingReference = req.BookingReference?.Trim(),
        };

        db.BusAssignments.Add(assignment);
        await db.SaveChangesAsync();

        var saved = await db.BusAssignments.Include(a => a.Driver).FirstAsync(a => a.Id == assignment.Id);
        return Ok(ToDto(saved));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssignmentRequest req)
    {
        var assignment = await db.BusAssignments.FindAsync(id);
        if (assignment == null) return NotFound();
        if (req.EndDate < req.StartDate)
            return BadRequest(new { error = "Sluttdato må være etter startdato." });

        var busId = req.BusId ?? assignment.BusId;
        var conflict = await FindConflictAsync(busId, req.DriverId, req.StartDate, req.EndDate, req.StartTime, req.EndTime, excludeId: id);
        if (conflict != null)
            return Conflict(new { error = conflict });

        assignment.BusId = busId;
        assignment.DriverId = req.DriverId;
        assignment.BookingId = req.BookingId ?? assignment.BookingId;
        assignment.StartDate = DateTime.SpecifyKind(req.StartDate.Date, DateTimeKind.Utc);
        assignment.EndDate = DateTime.SpecifyKind(req.EndDate.Date, DateTimeKind.Utc);
        assignment.StartTime = ParseTime(req.StartTime);
        assignment.EndTime = ParseTime(req.EndTime);
        assignment.Title = req.Title?.Trim() ?? assignment.Title;
        assignment.Type = req.Type ?? assignment.Type;
        assignment.Notes = req.Notes?.Trim();
        assignment.BookingReference = req.BookingReference?.Trim();

        await db.SaveChangesAsync();

        var saved = await db.BusAssignments.Include(a => a.Driver).FirstAsync(a => a.Id == id);
        return Ok(ToDto(saved));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var assignment = await db.BusAssignments.FindAsync(id);
        if (assignment == null) return NotFound();
        db.BusAssignments.Remove(assignment);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Replaces the full ordered stop list for a trip (simplest model for a reorderable
    // itinerary editor — the admin re-sends the whole list on every save).
    [HttpPut("{id}/stops")]
    public async Task<IActionResult> ReplaceStops(int id, [FromBody] List<StopRequest> stops)
    {
        var assignment = await db.BusAssignments.Include(a => a.Stops).FirstOrDefaultAsync(a => a.Id == id);
        if (assignment == null) return NotFound();

        db.TripStops.RemoveRange(assignment.Stops);
        assignment.Stops = stops.Select((s, i) => new TripStop
        {
            BusAssignmentId = id,
            SequenceNumber = i,
            Kind = i == 0 ? TripStopKind.Start : i == stops.Count - 1 ? TripStopKind.End : TripStopKind.Intermediate,
            Name = s.Name.Trim(),
            Description = s.Description?.Trim(),
            Latitude = s.Latitude,
            Longitude = s.Longitude,
            PlannedTime = DateTime.SpecifyKind(s.PlannedTime, DateTimeKind.Utc),
        }).ToList();

        await db.SaveChangesAsync();

        var saved = await db.BusAssignments.Include(a => a.Stops.OrderBy(s => s.SequenceNumber)).FirstAsync(a => a.Id == id);
        return Ok(saved.Stops.Select(s => new { s.Id, s.SequenceNumber, s.Kind, s.Name, s.Description, s.Latitude, s.Longitude, s.PlannedTime }));
    }

    // Returns a human-readable conflict message if BusId or DriverId is already
    // assigned to an overlapping trip in the given window, otherwise null.
    private async Task<string?> FindConflictAsync(
        string busId, int? driverId, DateTime startDate, DateTime endDate, string? startTime, string? endTime, int? excludeId)
    {
        var utcStartDate = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
        var utcEndDate = DateTime.SpecifyKind(endDate.Date, DateTimeKind.Utc);
        var startTimeOfDay = ParseTime(startTime) ?? TimeOnly.MinValue;
        var endTimeOfDay = ParseTime(endTime) ?? TimeOnly.MaxValue;
        var windowStart = utcStartDate + startTimeOfDay.ToTimeSpan();
        var windowEnd = utcEndDate + endTimeOfDay.ToTimeSpan();

        var candidates = await db.BusAssignments
            .Include(a => a.Driver)
            .Where(a => a.Id != excludeId && (a.BusId == busId || (driverId != null && a.DriverId == driverId)))
            .Where(a => a.StartDate <= utcEndDate && a.EndDate >= utcStartDate)
            .ToListAsync();

        foreach (var a in candidates)
        {
            var otherStart = a.StartDate.Date + (a.StartTime ?? TimeOnly.MinValue).ToTimeSpan();
            var otherEnd = a.EndDate.Date + (a.EndTime ?? TimeOnly.MaxValue).ToTimeSpan();
            if (windowStart >= otherEnd || otherStart >= windowEnd) continue; // no overlap

            if (a.BusId == busId)
                return $"Bussen er allerede tildelt oppgave \"{a.Title}\" i dette tidsrommet.";
            if (driverId != null && a.DriverId == driverId)
                return $"Sjåføren er allerede tildelt oppgave \"{a.Title}\" i dette tidsrommet.";
        }

        return null;
    }

    private static TimeOnly? ParseTime(string? s) =>
        TimeOnly.TryParse(s, out var t) ? t : null;

    private static object ToDto(BusAssignment a, Dictionary<string, string>? busNames = null) => new
    {
        a.Id, a.BusId,
        busName = busNames != null && busNames.TryGetValue(a.BusId, out var bn) ? bn : null,
        a.DriverId,
        driverName = a.Driver?.FullName,
        driverColor = a.Driver?.Color,
        a.StartDate, a.EndDate,
        startTime = a.StartTime?.ToString("HH:mm"),
        endTime = a.EndTime?.ToString("HH:mm"),
        a.Title, a.Type, a.Notes, a.BookingReference, a.BookingId, a.Status, a.CreatedAt,
        fromAddress = a.Booking?.FromAddress ?? a.Stops?.OrderBy(s => s.SequenceNumber).FirstOrDefault(s => s.Kind == TripStopKind.Start)?.Name,
        toAddress = a.Booking?.ToAddress ?? a.Stops?.OrderByDescending(s => s.SequenceNumber).FirstOrDefault(s => s.Kind == TripStopKind.End)?.Name,
    };

    private static object ToDetailDto(BusAssignment a) => new
    {
        a.Id, a.BusId, a.DriverId,
        driverName = a.Driver?.FullName,
        driverColor = a.Driver?.Color,
        a.StartDate, a.EndDate,
        startTime = a.StartTime?.ToString("HH:mm"),
        endTime = a.EndTime?.ToString("HH:mm"),
        a.Title, a.Type, a.Notes, a.BookingReference, a.BookingId, a.Status,
        a.StartedAt, a.FinishedAt, a.CreatedAt,
        a.CurrentLatitude, a.CurrentLongitude, a.PositionUpdatedAt,
        stops = a.Stops.Select(s => new
        {
            s.Id, s.SequenceNumber, s.Kind, s.Name, s.Description, s.Latitude, s.Longitude,
            s.PlannedTime, s.ActualArrival, s.ActualDeparture,
            notes = a.LogEntries.Where(l => l.TripStopId == s.Id).Select(l => new { l.Id, l.Message, l.CreatedAt }),
        }),
        tripNotes = a.LogEntries.Where(l => l.TripStopId == null).Select(l => new { l.Id, l.Message, l.CreatedAt }),
    };
}

public record AssignmentRequest(
    string? BusId, int? DriverId, int? BookingId,
    DateTime StartDate, DateTime EndDate,
    string? StartTime, string? EndTime,
    string? Title, string? Type, string? Notes, string? BookingReference);

public record StopRequest(string Name, string? Description, DateTime PlannedTime, double? Latitude, double? Longitude);
