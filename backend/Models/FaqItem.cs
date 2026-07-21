namespace BusSolutionApi.Models;

public class FaqItem
{
    public int Id { get; set; }
    public string Question { get; set; } = "";
    public string Answer { get; set; } = "";
    public int SortOrder { get; set; } = 0;
    public bool Active { get; set; } = true;
}
