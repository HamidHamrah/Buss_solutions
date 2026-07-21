namespace BusSolutionApi.Models;

public enum TripStopKind
{
    Start = 0,
    Intermediate = 1,
    End = 2,
}

public class TripStop
{
    public int Id { get; set; }
    public int BusAssignmentId { get; set; }
    public BusAssignment? BusAssignment { get; set; }

    public int SequenceNumber { get; set; }
    public TripStopKind Kind { get; set; } = TripStopKind.Intermediate;
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public DateTime PlannedTime { get; set; }
    public DateTime? ActualArrival { get; set; }
    public DateTime? ActualDeparture { get; set; }

    public List<TripLogEntry> LogEntries { get; set; } = [];
}
