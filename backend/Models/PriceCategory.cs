namespace BusSolutionApi.Models;

public class PriceCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal KmRate { get; set; }
    public decimal HourRate { get; set; }
    public int SortOrder { get; set; }
}
