namespace BusSolutionApi.Models;

public class TripLogEntry
{
    public int Id { get; set; }
    public int BusAssignmentId { get; set; }
    public BusAssignment? BusAssignment { get; set; }

    // Null = a trip-level note. Set = a note tied to a specific stop.
    public int? TripStopId { get; set; }
    public TripStop? TripStop { get; set; }

    public string Message { get; set; } = "";
    public int CreatedByDriverId { get; set; }
    public Driver? CreatedByDriver { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
