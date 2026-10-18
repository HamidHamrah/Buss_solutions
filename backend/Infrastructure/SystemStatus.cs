using BusSolutionApi.Data;
using BusSolutionApi.Models;
using BusSolutionApi.Services;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Infrastructure;

public record StatusCheck(string Name, string Status, string Detail);
public record StatusReport(string Status, DateTime Utc, List<StatusCheck> Checks);

// Aggregated readiness report. Never includes secrets — only booleans and counts.
public static class SystemStatus
{
    public static async Task<StatusReport> BuildAsync(AppDbContext db, EmailDelivery email)
    {
        var checks = new List<StatusCheck>();

        try
        {
            await db.Database.ExecuteSqlRawAsync("SELECT 1");
            checks.Add(new("database", "ok", "Tilkoblet"));
        }
        catch
        {
            checks.Add(new("database", "unhealthy", "Får ikke kontakt med databasen"));
            return new StatusReport("unhealthy", DateTime.UtcNow, checks);
        }

        var smtp = await email.IsConfiguredAsync();
        checks.Add(new("email", smtp ? "ok" : "degraded", smtp ? "SMTP er konfigurert" : "SMTP er ikke konfigurert — e-post sendes ikke"));

        var cfg = await db.SiteConfigs.AsNoTracking().OrderBy(c => c.Id).FirstOrDefaultAsync();
        var fiken = cfg != null && FikenService.IsConfigured(cfg);
        checks.Add(new("fiken", "ok", fiken ? "Fiken er koblet til" : "Fiken er ikke koblet til (valgfritt)"));

        var failed = await db.EmailOutbox.CountAsync(e => e.Status == EmailStatus.Failed);
        var stale = await db.EmailOutbox.CountAsync(e => e.Status == EmailStatus.Pending && e.CreatedAt < DateTime.UtcNow.AddMinutes(-30));
        checks.Add(new("emailQueue", failed + stale > 0 ? "degraded" : "ok",
            failed + stale > 0 ? $"{failed} mislykket, {stale} står fast i køen" : "Køen er tom eller i gang"));

        var overall = checks.Any(c => c.Status == "unhealthy") ? "unhealthy"
            : checks.Any(c => c.Status == "degraded") ? "degraded" : "ok";
        return new StatusReport(overall, DateTime.UtcNow, checks);
    }
}
