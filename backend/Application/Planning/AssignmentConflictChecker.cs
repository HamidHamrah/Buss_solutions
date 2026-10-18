using BusSolutionApi.Data;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Application.Planning;

public class AssignmentConflictChecker(AppDbContext db)
{
    public async Task<string?> FindConflictAsync(
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
            if (windowStart >= otherEnd || otherStart >= windowEnd) continue;

            if (a.BusId == busId)
                return $"Bussen er allerede tildelt oppgave \"{a.Title}\" i dette tidsrommet.";
            if (driverId != null && a.DriverId == driverId)
                return $"Sjåføren er allerede tildelt oppgave \"{a.Title}\" i dette tidsrommet.";
        }

        return null;
    }

    public static TimeOnly? ParseTime(string? s) =>
        TimeOnly.TryParse(s, out var t) ? t : null;
}

