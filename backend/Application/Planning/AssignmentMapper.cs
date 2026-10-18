using BusSolutionApi.Models;

namespace BusSolutionApi.Application.Planning;

public static class AssignmentMapper
{
    public static object ToDto(BusAssignment a, Dictionary<string, string>? busNames = null) => new
    {
        a.Id, a.BusId, a.TrackingToken,
        busName = busNames != null && busNames.TryGetValue(a.BusId, out var bn) ? bn : null,
        a.DriverId,
        driverName = a.Driver?.FullName,
        driverColor = a.Driver?.Color,
        a.StartDate, a.EndDate,
        startTime = a.StartTime?.ToString("HH:mm"),
        endTime = a.EndTime?.ToString("HH:mm"),
        a.Title, a.Type, a.Notes, a.BookingReference, a.BookingId, a.Status, a.CreatedAt,
        fromAddress = a.Stops?.OrderBy(s => s.SequenceNumber).FirstOrDefault(s => s.Kind == TripStopKind.Start)?.Name ?? a.Booking?.FromAddress,
        toAddress = a.Stops?.OrderByDescending(s => s.SequenceNumber).FirstOrDefault(s => s.Kind == TripStopKind.End)?.Name ?? a.Booking?.ToAddress,
        passengers = a.Booking?.Passengers,
        customerName = a.Booking?.ContactName,
        customerPhone = a.Booking?.ContactPhone,
        bookingStatus = a.Booking?.Status,
    };

    public static object ToDetailDto(BusAssignment a) => new
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

