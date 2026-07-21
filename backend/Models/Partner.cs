namespace BusSolutionApi.Models;

public class Partner
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string LogoUrl { get; set; } = "";
    public string WebsiteUrl { get; set; } = "";
    public int SortOrder { get; set; }
    public bool Active { get; set; } = true;
}
