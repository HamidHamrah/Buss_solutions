using System.Runtime.CompilerServices;
using System.Security.Claims;
using BusSolutionApi.Data;
using BusSolutionApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace BusSolutionApi.Infrastructure;

// Records who changed what for the business-critical entities. Runs in two phases because new rows
// only get their Id after the save: collect while saving, write the AuditLog rows once saved.
public class AuditSaveChangesInterceptor(IHttpContextAccessor http) : SaveChangesInterceptor
{
    private static readonly HashSet<Type> Tracked =
    [
        typeof(Booking), typeof(SiteConfig), typeof(PriceCategory), typeof(Bus), typeof(Driver), typeof(BusAssignment),
    ];

    // Never written to the log, even as "changed" — secrets, noise.
    private static readonly HashSet<string> Silent =
    [
        "PasswordHash", "AdminPasswordHash", "FikenApiToken", "SmtpPassword", "TwilioAuthToken",
        "UpdatedAt", "LastLoginAt", "FikenSyncedAt",
    ];

    private record Pending(EntityEntry Entry, string Action, string Summary);
    private static readonly ConditionalWeakTable<DbContext, List<Pending>> PendingByContext = new();
    private static readonly ConditionalWeakTable<DbContext, object> Writing = new();

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Collect(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Collect(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        await Flush(eventData.Context, cancellationToken);
        return await base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        Flush(eventData.Context, CancellationToken.None).GetAwaiter().GetResult();
        return base.SavedChanges(eventData, result);
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData) => Discard(eventData.Context);

    public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
    {
        Discard(eventData.Context);
        return base.SaveChangesFailedAsync(eventData, cancellationToken);
    }

    private static void Discard(DbContext? ctx)
    {
        if (ctx != null) PendingByContext.Remove(ctx);
    }

    private static void Collect(DbContext? ctx)
    {
        if (ctx == null || Writing.TryGetValue(ctx, out _)) return;
        var list = new List<Pending>();
        foreach (var e in ctx.ChangeTracker.Entries())
        {
            if (!Tracked.Contains(e.Entity.GetType())) continue;
            switch (e.State)
            {
                case EntityState.Added:
                    list.Add(new Pending(e, "created", "Opprettet"));
                    break;
                case EntityState.Deleted:
                    list.Add(new Pending(e, "deleted", Describe(e)));
                    break;
                case EntityState.Modified:
                    var changes = e.Properties
                        .Where(p => p.IsModified && !p.Metadata.IsPrimaryKey() && !Silent.Contains(p.Metadata.Name)
                            && !Equals(p.OriginalValue, p.CurrentValue))
                        .Select(p => $"{p.Metadata.Name}: {Show(p.OriginalValue)} → {Show(p.CurrentValue)}")
                        .ToList();
                    if (changes.Count > 0) list.Add(new Pending(e, "updated", string.Join("; ", changes)));
                    break;
            }
        }
        if (list.Count > 0) PendingByContext.AddOrUpdate(ctx, list);
    }

    private async Task Flush(DbContext? ctx, CancellationToken ct)
    {
        if (ctx is not AppDbContext db || !PendingByContext.TryGetValue(ctx, out var pending)) return;
        PendingByContext.Remove(ctx);

        var user = http.HttpContext?.User;
        var actor = user?.Identity?.IsAuthenticated == true
            ? $"{user.FindFirstValue(ClaimTypes.Role) ?? "Bruker"}{(user.FindFirstValue(ClaimTypes.NameIdentifier) is { } id ? $" #{id}" : "")}"
            : "System";
        var ip = http.HttpContext?.Connection.RemoteIpAddress?.ToString();

        foreach (var p in pending)
        {
            var key = p.Entry.Properties.FirstOrDefault(x => x.Metadata.IsPrimaryKey())?.CurrentValue;
            db.AuditLogs.Add(new AuditLog
            {
                Actor = actor,
                Action = p.Action,
                EntityType = p.Entry.Entity.GetType().Name,
                EntityId = key?.ToString(),
                Summary = Truncate(p.Action == "created" ? "Opprettet" : p.Summary, 1500),
                IpAddress = ip,
            });
        }

        Writing.AddOrUpdate(ctx, new object());
        try { await db.SaveChangesAsync(ct); }
        finally { Writing.Remove(ctx); }
    }

    private static string Describe(EntityEntry e) => e.Entity switch
    {
        Booking b => $"Slettet bestilling {b.Reference}",
        Driver d => $"Slettet sjåfør {d.FullName}",
        Bus b => $"Slettet buss {b.Name}",
        BusAssignment a => $"Slettet kjøreordre {a.Title}",
        PriceCategory c => $"Slettet priskategori {c.Name}",
        _ => "Slettet",
    };

    private static string Show(object? v) => v switch
    {
        null => "–",
        System.Collections.IEnumerable and not string => "[liste]",
        _ => Truncate(v.ToString() ?? "", 80),
    };

    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max] + "…";
}
