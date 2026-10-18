using BusSolutionApi.Data;
using BusSolutionApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Application.Bookings;

public record NextAction(string Stage, string Label, string Action, string Priority);
public record InboxItem(string Kind, string Stage, string Action, string Priority, int? BookingId, string? Reference, string Title, string Subtitle, DateTime Date, decimal? Amount);

public class OperationsQueries(AppDbContext db)
{
    private const int OverdueDays = 14;

    private record TripInfo(int BookingId, string BusId, int? DriverId, TripStatus Status);

    // Lifecycle stage + the single most relevant next step for a booking.
    public static NextAction Resolve(Booking b, int planned, int trips, int tripsWithoutDriver, bool anyInProgress, bool allDone, DateTime today)
    {
        if (b.Status == BookingStatus.Cancelled) return new("cancelled", "Avlyst", "Ingen handling", "none");
        if (b.PaymentStatus == PaymentStatus.Paid) return new("paid", "Betalt", "Ingen handling", "none");
        if (b.Status == BookingStatus.New) return new("new", "Ny forespørsel", "Svar kunden eller bekreft", "high");
        if (b.Status == BookingStatus.Quoted) return new("quoted", "Tilbud sendt", "Følg opp tilbudet", "normal");

        if (b.InvoiceSentAt != null)
        {
            var overdue = (today - b.InvoiceSentAt.Value.Date).TotalDays > OverdueDays;
            return overdue
                ? new("invoice_sent", "Faktura sendt", "Purr – forfalt", "high")
                : new("invoice_sent", "Faktura sendt", "Vent på betaling", "low");
        }
        if (b.InvoiceNumber != null) return new("invoice_draft", "Fakturautkast", "Send faktura", "normal");

        if (allDone && planned >= b.BusCount) return new("ready_to_invoice", "Klar til fakturering", "Lag faktura", "normal");
        if (anyInProgress) return new("in_progress", "Pågår", "Følg turen", "low");
        if (planned < b.BusCount) return new("needs_planning", "Må planlegges", planned == 0 ? "Planlegg buss og sjåfør" : $"Planlegg {b.BusCount - planned} buss til", b.DepartureDate.Date <= today.AddDays(7) ? "high" : "normal");
        if (tripsWithoutDriver > 0) return new("planned", "Planlagt", "Tildel sjåfør", "high");
        return new("planned", "Planlagt", "Klar for avreise", "low");
    }

    private async Task<Dictionary<int, List<TripInfo>>> LoadTripsAsync()
    {
        var rows = await db.BusAssignments
            .Where(a => a.BookingId != null && a.Type == "trip" && a.Status != TripStatus.Cancelled)
            .Select(a => new TripInfo(a.BookingId!.Value, a.BusId, a.DriverId, a.Status))
            .ToListAsync();
        return rows.GroupBy(r => r.BookingId).ToDictionary(g => g.Key, g => g.ToList());
    }

    private static NextAction ResolveFor(Booking b, Dictionary<int, List<TripInfo>> trips, DateTime today)
    {
        var t = trips.GetValueOrDefault(b.Id) ?? [];
        var planned = t.Select(x => x.BusId).Distinct().Count();
        var allDone = t.Count > 0 && t.All(x => x.Status == TripStatus.Completed);
        return Resolve(b, planned, t.Count, t.Count(x => x.DriverId == null && x.Status == TripStatus.Planned),
            t.Any(x => x.Status == TripStatus.InProgress), allDone, today);
    }

    public async Task<object> GetInboxAsync()
    {
        var today = DateTime.UtcNow.Date;
        var trips = await LoadTripsAsync();
        var bookings = await db.Bookings.Where(b => b.Status != BookingStatus.Cancelled && b.PaymentStatus != PaymentStatus.Paid).ToListAsync();

        var items = new List<InboxItem>();
        foreach (var b in bookings)
        {
            var na = ResolveFor(b, trips, today);
            if (na.Priority is "none" or "low") continue;
            items.Add(new InboxItem(na.Stage, na.Label, na.Action, na.Priority, b.Id, b.Reference, b.ContactName,
                $"{b.FromAddress} → {b.ToAddress}", b.DepartureDate, b.EstimatedTotal));
        }

        var unread = await db.ContactMessages.Where(m => m.Status == ContactStatus.New)
            .OrderByDescending(m => m.CreatedAt).Take(20).ToListAsync();
        items.AddRange(unread.Select(m => new InboxItem("contact", "Ny melding", "Svar på henvendelse", "normal",
            null, null, m.Name, m.Subject, m.CreatedAt, null)));

        return items
            .OrderBy(i => i.Priority == "high" ? 0 : 1)
            .ThenBy(i => i.Date)
            .ToList();
    }

    public async Task<object> SearchAsync(string? q)
    {
        q = q?.Trim();
        if (string.IsNullOrEmpty(q) || q.Length < 2) return Array.Empty<object>();

        var like = $"%{q}%";
        var digits = new string(q.Where(char.IsDigit).ToArray());

        DateTime? date = null;
        foreach (var fmt in new[] { "yyyy-MM-dd", "dd.MM.yyyy", "d.M.yyyy", "dd.MM.yy" })
            if (DateTime.TryParseExact(q, fmt, null, System.Globalization.DateTimeStyles.None, out var d)) { date = DateTime.SpecifyKind(d.Date, DateTimeKind.Utc); break; }

        var driverBookingIds = await db.BusAssignments
            .Where(a => a.BookingId != null && a.Driver != null &&
                (EF.Functions.ILike(a.Driver.FirstName + " " + a.Driver.LastName, like)))
            .Select(a => a.BookingId!.Value).Distinct().ToListAsync();

        var matches = await db.Bookings
            .Where(b => EF.Functions.ILike(b.Reference, like)
                || EF.Functions.ILike(b.ContactName, like)
                || (b.OrgName != null && EF.Functions.ILike(b.OrgName, like))
                || EF.Functions.ILike(b.ContactEmail, like)
                || (digits.Length >= 4 && EF.Functions.ILike(b.ContactPhone, "%" + digits + "%"))
                || (b.InvoiceNumber != null && EF.Functions.ILike(b.InvoiceNumber, like))
                || (date != null && b.DepartureDate >= date && b.DepartureDate < date.Value.AddDays(1))
                || driverBookingIds.Contains(b.Id))
            .OrderByDescending(b => b.DepartureDate)
            .Take(15)
            .ToListAsync();

        var trips = await LoadTripsAsync();
        var today = DateTime.UtcNow.Date;
        return matches.Select(b =>
        {
            var na = ResolveFor(b, trips, today);
            return new
            {
                b.Id, b.Reference, b.ContactName, b.OrgName, b.DepartureDate, b.FromAddress, b.ToAddress,
                b.InvoiceNumber, stage = na.Label, stageKey = na.Stage, action = na.Action, priority = na.Priority,
            };
        }).ToList();
    }
}
