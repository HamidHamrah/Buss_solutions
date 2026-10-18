using BusSolutionApi.Data;
using BusSolutionApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Application.Planning;

public class TripPlanningService(AppDbContext db, AssignmentConflictChecker conflictChecker)
{
    public async Task<object> GetAllAsync(
        int? year, int? month,
        DateTime? from, DateTime? to,
        TripStatus? status,
        int? bookingId, string? search)
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

        return items.Select(a => AssignmentMapper.ToDto(a, busNames));
    }

    public async Task<object?> GetByIdAsync(int id)
    {
        var assignment = await db.BusAssignments
            .Include(a => a.Driver)
            .Include(a => a.Stops.OrderBy(s => s.SequenceNumber))
            .Include(a => a.LogEntries.OrderBy(l => l.CreatedAt))
            .FirstOrDefaultAsync(a => a.Id == id);

        return assignment == null ? null : AssignmentMapper.ToDetailDto(assignment);
    }

    public async Task<object?> GetPositionHistoryAsync(int id)
    {
        var exists = await db.BusAssignments.AnyAsync(a => a.Id == id);
        if (!exists) return null;

        return await db.BusPositionPings
            .Where(p => p.BusAssignmentId == id)
            .OrderBy(p => p.RecordedAt)
            .Select(p => new { p.Latitude, p.Longitude, p.RecordedAt })
            .ToListAsync();
    }

    public async Task<(object? Result, string? Error, int StatusCode)> CreateAsync(AssignmentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.BusId))
            return (null, "BusId er påkrevd.", 400);
        if (req.EndDate < req.StartDate)
            return (null, "Sluttdato må være etter startdato.", 400);

        var conflict = await conflictChecker.FindConflictAsync(req.BusId, req.DriverId, req.StartDate, req.EndDate, req.StartTime, req.EndTime, excludeId: null);
        if (conflict != null)
            return (null, conflict, 409);

        var assignment = new BusAssignment
        {
            BusId = req.BusId,
            DriverId = req.DriverId,
            BookingId = req.BookingId,
            StartDate = DateTime.SpecifyKind(req.StartDate.Date, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(req.EndDate.Date, DateTimeKind.Utc),
            StartTime = AssignmentConflictChecker.ParseTime(req.StartTime),
            EndTime = AssignmentConflictChecker.ParseTime(req.EndTime),
            Title = req.Title?.Trim() ?? "",
            Type = req.Type ?? "trip",
            Notes = req.Notes?.Trim(),
            BookingReference = req.BookingReference?.Trim(),
        };

        db.BusAssignments.Add(assignment);
        await db.SaveChangesAsync();

        var saved = await db.BusAssignments.Include(a => a.Driver).FirstAsync(a => a.Id == assignment.Id);
        return (AssignmentMapper.ToDto(saved), null, 200);
    }

    public async Task<(object? Result, string? Error, int StatusCode)> UpdateAsync(int id, AssignmentRequest req)
    {
        var assignment = await db.BusAssignments.FindAsync(id);
        if (assignment == null) return (null, null, 404);
        if (req.EndDate < req.StartDate)
            return (null, "Sluttdato må være etter startdato.", 400);

        var busId = req.BusId ?? assignment.BusId;
        var conflict = await conflictChecker.FindConflictAsync(busId, req.DriverId, req.StartDate, req.EndDate, req.StartTime, req.EndTime, excludeId: id);
        if (conflict != null)
            return (null, conflict, 409);

        assignment.BusId = busId;
        assignment.DriverId = req.DriverId;
        assignment.BookingId = req.BookingId ?? assignment.BookingId;
        assignment.StartDate = DateTime.SpecifyKind(req.StartDate.Date, DateTimeKind.Utc);
        assignment.EndDate = DateTime.SpecifyKind(req.EndDate.Date, DateTimeKind.Utc);
        assignment.StartTime = AssignmentConflictChecker.ParseTime(req.StartTime);
        assignment.EndTime = AssignmentConflictChecker.ParseTime(req.EndTime);
        assignment.Title = req.Title?.Trim() ?? assignment.Title;
        assignment.Type = req.Type ?? assignment.Type;
        assignment.Notes = req.Notes?.Trim();
        assignment.BookingReference = req.BookingReference?.Trim();

        await db.SaveChangesAsync();

        var saved = await db.BusAssignments.Include(a => a.Driver).FirstAsync(a => a.Id == id);
        return (AssignmentMapper.ToDto(saved), null, 200);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var assignment = await db.BusAssignments.FindAsync(id);
        if (assignment == null) return false;

        db.BusAssignments.Remove(assignment);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<object?> ReplaceStopsAsync(int id, List<StopRequest> stops)
    {
        var assignment = await db.BusAssignments.Include(a => a.Stops).FirstOrDefaultAsync(a => a.Id == id);
        if (assignment == null) return null;

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
        return saved.Stops.Select(s => new { s.Id, s.SequenceNumber, s.Kind, s.Name, s.Description, s.Latitude, s.Longitude, s.PlannedTime });
    }
}

