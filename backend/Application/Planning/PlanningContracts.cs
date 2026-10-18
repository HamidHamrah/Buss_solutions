namespace BusSolutionApi.Application.Planning;

public record AssignmentRequest(
    string? BusId, int? DriverId, int? BookingId,
    DateTime StartDate, DateTime EndDate,
    string? StartTime, string? EndTime,
    string? Title, string? Type, string? Notes, string? BookingReference);

public record StopRequest(string Name, string? Description, DateTime PlannedTime, double? Latitude, double? Longitude);

