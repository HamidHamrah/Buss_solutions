namespace BusSolutionApi.Models;

public class Bus
{
    public int Id { get; set; }
    public string ExternalId { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string RegistrationNumber { get; set; } = "";
    public int Seats { get; set; }
    public string Description { get; set; } = "";
    public List<string> Images { get; set; } = [];
    public List<string> Amenities { get; set; } = [];
    public bool Active { get; set; } = true;
    public int SortOrder { get; set; }
    public int? PriceCategoryId { get; set; }
    public PriceCategory? PriceCategory { get; set; }
}
