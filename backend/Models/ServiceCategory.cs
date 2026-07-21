namespace BusSolutionApi.Models;

public class ServiceCategory
{
    public int Id { get; set; }
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string Intro { get; set; } = "";
    public string HeroImage { get; set; } = "";
    public string DetailImage { get; set; } = "";
    public string Headline { get; set; } = "";
    public List<string> Body { get; set; } = [];
    public List<string> Highlights { get; set; } = [];
    public string Group { get; set; } = "";
    public int SortOrder { get; set; } = 0;
    public bool Active { get; set; } = true;
}
