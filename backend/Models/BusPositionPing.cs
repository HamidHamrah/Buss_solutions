namespace BusSolutionApi.Models;

// One logged GPS ping from a driver's phone while a trip is in progress — an
// append-only history of where the bus has actually been, separate from
// BusAssignment.CurrentLatitude/Longitude which only holds the latest point.
public class BusPositionPing
{
    public int Id { get; set; }
    public int BusAssignmentId { get; set; }
    public BusAssignment? BusAssignment { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}
