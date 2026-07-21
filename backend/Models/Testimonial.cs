namespace BusSolutionApi.Models;

public class Testimonial
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string AvatarColor { get; set; } = "#4F46E5";
    public string AvatarImageUrl { get; set; } = "";
    public int Rating { get; set; } = 5;
    public string Text { get; set; } = "";
    public string Source { get; set; } = "Google";
    public int SortOrder { get; set; } = 0;
    public bool Active { get; set; } = true;
}
