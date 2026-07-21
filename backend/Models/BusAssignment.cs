namespace BusSolutionApi.Models;

public enum TripStatus
{
    Planned = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
}

public class BusAssignment
{
    public int Id { get; set; }
    public string BusId { get; set; } = ""; // Bus.ExternalId
    public int? DriverId { get; set; }
    public Driver? Driver { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string Title { get; set; } = "";
    public string Type { get; set; } = "trip"; // trip | maintenance | other
    public string? Notes { get; set; }
    public string? BookingReference { get; set; }
    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }
    public TripStatus Status { get; set; } = TripStatus.Planned;
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Live position — only ever updated while Status == InProgress.
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public DateTime? PositionUpdatedAt { get; set; }

    public List<TripStop> Stops { get; set; } = [];
    public List<TripLogEntry> LogEntries { get; set; } = [];
    public List<BusPositionPing> PositionPings { get; set; } = [];
}
