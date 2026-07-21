namespace BusSolutionApi.Models;

public class JobApplication
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Age { get; set; } = "";
    public string Location { get; set; } = "";
    public string Education { get; set; } = "";
    public string CurrentJob { get; set; } = "";
    public string Notes { get; set; } = "";
    public string CvUrl { get; set; } = "";
    public string LicenseFrontUrl { get; set; } = "";
    public string LicenseBackUrl { get; set; } = "";
    public string YskUrl { get; set; } = "";
    public string Status { get; set; } = "Ny"; // Ny | Vurderes | Avvist | Ansatt
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
