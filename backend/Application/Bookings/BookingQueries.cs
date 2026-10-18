using BusSolutionApi.Data;
using BusSolutionApi.Models;
using BusSolutionApi.Services;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Application.Bookings;

public class BookingQueries(AppDbContext db)
{
    public async Task<object> GetAllAsync(int page, int pageSize)
    {
        var total = await db.Bookings.CountAsync();
        var bookings = await db.Bookings
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new { total, page, pageSize, bookings };
    }

    public async Task<List<object>> GetActivityAsync(int id) =>
        (await db.BookingActivities.Where(a => a.BookingId == id).OrderByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id)
            .Select(a => new { a.Id, a.Type, a.Message, a.CreatedAt }).ToListAsync()).Cast<object>().ToList();

    public Task<Booking?> GetByIdAsync(int id) => db.Bookings.FindAsync(id).AsTask();

    public async Task<object> GetUnplannedAsync()
    {
        var plannedCounts = await db.BusAssignments
            .Where(a => a.BookingId != null && a.Type == "trip")
            .GroupBy(a => a.BookingId!.Value)
            .Select(g => new { BookingId = g.Key, Count = g.Select(a => a.BusId).Distinct().Count() })
            .ToDictionaryAsync(x => x.BookingId, x => x.Count);

        var bookings = await db.Bookings
            .Where(b => b.Status != BookingStatus.Cancelled)
            .OrderBy(b => b.DepartureDate)
            .Select(b => new
            {
                b.Id, b.Reference, b.ContactName, b.ContactPhone,
                b.FromAddress, b.ToAddress, b.DepartureDate, b.DepartureTime,
                b.TripType, b.ReturnDate, b.ReturnTime, b.Stops,
                b.Passengers, b.BusCount, b.EstimatedTotal, b.Status, b.DistanceKm,
            })
            .ToListAsync();

        return bookings
            .Select(b => new
            {
                b.Id, b.Reference, b.ContactName, b.ContactPhone,
                b.FromAddress, b.ToAddress, b.DepartureDate, b.DepartureTime,
                b.TripType, b.ReturnDate, b.ReturnTime, b.Stops,
                b.Passengers, b.BusCount, b.EstimatedTotal, b.Status, b.DistanceKm,
                plannedCount = plannedCounts.GetValueOrDefault(b.Id, 0),
            })
            .Where(b => b.plannedCount < b.BusCount)
            .ToList();
    }

    public async Task<object> GetStatsAsync()
    {
        var all = await db.Bookings.ToListAsync();
        var now = DateTime.UtcNow;

        var months = Enumerable.Range(0, 6)
            .Select(i => now.AddMonths(-5 + i))
            .Select(d => new DateTime(d.Year, d.Month, 1))
            .ToList();

        var perMonth = months.Select(m => new
        {
            month = m.ToString("MMM", new System.Globalization.CultureInfo("nb-NO")),
            new_ = all.Count(b => b.CreatedAt.Year == m.Year && b.CreatedAt.Month == m.Month && b.Status == BookingStatus.New),
            confirmed = all.Count(b => b.CreatedAt.Year == m.Year && b.CreatedAt.Month == m.Month && b.Status == BookingStatus.Confirmed),
            cancelled = all.Count(b => b.CreatedAt.Year == m.Year && b.CreatedAt.Month == m.Month && b.Status == BookingStatus.Cancelled),
            revenue = all.Where(b => b.CreatedAt.Year == m.Year && b.CreatedAt.Month == m.Month && b.Status == BookingStatus.Confirmed)
                .Sum(b => b.EstimatedTotal),
        });

        var confirmed = all.Where(b => b.Status == BookingStatus.Confirmed).ToList();
        var thisMonth = all.Where(b => b.CreatedAt.Year == now.Year && b.CreatedAt.Month == now.Month).ToList();
        var lastMonth = all.Where(b => b.CreatedAt.Year == now.AddMonths(-1).Year && b.CreatedAt.Month == now.AddMonths(-1).Month).ToList();

        var byBus = all.GroupBy(b => b.BusName)
            .Select(g => new { bus = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(5);

        return new
        {
            totals = new
            {
                all = all.Count,
                newCount = all.Count(b => b.Status == BookingStatus.New),
                confirmed = confirmed.Count,
                cancelled = all.Count(b => b.Status == BookingStatus.Cancelled),
                revenue = confirmed.Sum(b => b.EstimatedTotal),
                thisMonth = thisMonth.Count,
                lastMonth = lastMonth.Count,
            },
            perMonth,
            byBus,
        };
    }

    public async Task<object> GetInvoicesAsync(string? status)
    {
        var busesPlanned = await db.BusAssignments
            .Where(a => a.BookingId != null && a.Type == "trip")
            .GroupBy(a => a.BookingId!.Value)
            .Select(g => new { BookingId = g.Key, Count = g.Select(a => a.BusId).Distinct().Count() })
            .ToDictionaryAsync(x => x.BookingId, x => x.Count);
        var incompleteBookingIds = (await db.BusAssignments
            .Where(a => a.BookingId != null && a.Type == "trip" && a.Status != TripStatus.Completed)
            .Select(a => a.BookingId!.Value)
            .Distinct()
            .ToListAsync()).ToHashSet();
        var inProgressBookingIds = (await db.BusAssignments
            .Where(a => a.BookingId != null && a.Type == "trip" && a.Status == TripStatus.InProgress)
            .Select(a => a.BookingId!.Value)
            .Distinct()
            .ToListAsync()).ToHashSet();

        var siteConfig = await db.SiteConfigs.FirstOrDefaultAsync();
        var fikenConfigured = siteConfig != null && FikenService.IsConfigured(siteConfig);
        var now = DateTime.UtcNow;

        var bookings = await db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed || b.InvoiceNumber != null)
            .OrderByDescending(b => b.DepartureDate)
            .ToListAsync();

        return bookings.Select(b =>
        {
            var planned = busesPlanned.GetValueOrDefault(b.Id, 0);
            var fullyPlanned = planned >= b.BusCount;
            var hasTrips = planned > 0;
            var tripStatus = !hasTrips ? "unplanned"
                : !fullyPlanned ? "planning"
                : !incompleteBookingIds.Contains(b.Id) ? "completed"
                : inProgressBookingIds.Contains(b.Id) ? "in_progress"
                : "planned";
            var invoiceStatus = b.InvoiceSentAt != null ? "sent" : b.InvoiceNumber != null ? "draft" : "none";
            DateTime? dueDate = b.InvoiceDate?.AddDays(14);
            var overdue = invoiceStatus == "sent" && b.PaymentStatus == PaymentStatus.Unpaid && dueDate < now;
            var readyToInvoice = invoiceStatus == "none" && b.Status == BookingStatus.Confirmed && tripStatus == "completed";

            return new
            {
                b.Id, b.Reference, b.ContactName, b.OrgName, b.DepartureDate, b.FromAddress, b.ToAddress,
                b.InvoiceNumber, b.InvoiceDate, b.InvoiceSentAt,
                b.EstimatedTotal, b.PaymentStatus, b.PaidDate,
                busesPlanned = planned, b.BusCount, tripStatus, invoiceStatus,
                b.ContactEmail, dueDate, overdue, readyToInvoice,
                b.FikenInvoiceId, b.FikenSyncedAt, fikenConfigured,
            };
        })
        .Where(x => status switch
        {
            "none" => x.invoiceStatus == "none",
            "draft" => x.invoiceStatus == "draft",
            "sent" => x.invoiceStatus == "sent",
            "ready" => x.readyToInvoice,
            "overdue" => x.overdue,
            "unpaid" => x.invoiceStatus == "sent" && x.PaymentStatus == PaymentStatus.Unpaid,
            "paid" => x.PaymentStatus == PaymentStatus.Paid,
            _ => true,
        })
        .ToList();
    }
}

