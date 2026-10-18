using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Infrastructure;

// For events that are not entity changes (logins, manual actions).
public class AuditService(AppDbContext db, IHttpContextAccessor http)
{
    public async Task RecordAsync(string action, string entityType, string? entityId, string summary, string? actor = null)
    {
        db.AuditLogs.Add(new AuditLog
        {
            Actor = actor ?? "System",
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Summary = summary,
            IpAddress = http.HttpContext?.Connection.RemoteIpAddress?.ToString(),
        });
        await db.SaveChangesAsync();
    }
}
