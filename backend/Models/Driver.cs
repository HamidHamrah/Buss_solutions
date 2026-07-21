namespace BusSolutionApi.Models;

public class Driver
{
    public int Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string Notes { get; set; } = "";
    public bool Active { get; set; } = true;
    public string Color { get; set; } = "#3b82f6"; // for calendar display
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Login — everyone (driver or admin) logs in with their own phone number.
    public string PasswordHash { get; set; } = "";
    public bool MustChangePassword { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public bool IsAdmin { get; set; } = false;

    public string FullName => $"{FirstName} {LastName}".Trim();
}
