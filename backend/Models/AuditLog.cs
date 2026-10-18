namespace BusSolutionApi.Models;

// Append-only trail of business-critical changes. Written automatically by AuditSaveChangesInterceptor
// for tracked entity types, and explicitly via AuditService for events such as logins.
public class AuditLog
{
    public long Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Actor { get; set; } = "System";
    public string Action { get; set; } = "";     // e.g. created, updated, deleted, login.failed
    public string EntityType { get; set; } = "";
    public string? EntityId { get; set; }
    public string Summary { get; set; } = "";
    public string? IpAddress { get; set; }
}
