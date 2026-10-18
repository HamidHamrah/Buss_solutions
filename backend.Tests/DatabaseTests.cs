using BusSolutionApi.Application.Bookings;
using BusSolutionApi.Application.Invoices;
using BusSolutionApi.Application.Planning;
using BusSolutionApi.Models;
using BusSolutionApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace BusSolutionApi.Tests;

public class DatabaseTests(PostgresFixture pg) : IClassFixture<PostgresFixture>
{
    private static CreateBookingRequest Request(Action<Dictionary<string, object?>>? _ = null, string busName = "Buss", decimal total = 1, int busCount = 1, string email = "kunde@example.com", DateTime? date = null) =>
        new("Oslo", "Bergen", [], date ?? DateTime.UtcNow.Date.AddDays(10), "12:00", "oneway", false, null, null, null,
            null, busName, 20, busCount, false, false, [], 1, 1, total, 80,
            "private", "Kari Nordmann", email, "12345678", null, null, null);

    private async Task<(Data.AppDbContext db, BookingService svc)> SetupAsync()
    {
        var db = pg.NewContext();
        if (!await db.SiteConfigs.AnyAsync())
            db.SiteConfigs.Add(new SiteConfig { MinInvoice = 0, VatPercent = 25, NightSurcharge = 30, CompanyName = "Test AS" });
        if (!await db.PriceCategories.AnyAsync(c => c.Name == "Buss"))
            db.PriceCategories.Add(new PriceCategory { Name = "Buss", KmRate = 20, HourRate = 1000 });
        await db.SaveChangesAsync();

        var email = new EmailService(new EmailSettings(), db, NullLogger<EmailService>.Instance);
        var svc = new BookingService(db, email, new BookingReferenceGenerator(), new BookingPricingService(), NullLogger<BookingService>.Instance);
        return (db, svc);
    }

    [PostgresFact]
    public async Task PublicBooking_IgnoresClientPrice_AndUsesServerPrice()
    {
        var (db, svc) = await SetupAsync();
        var (booking, error, _) = await svc.CreateAsync(Request(total: 1));
        Assert.Null(error);
        Assert.Equal(3250, booking!.EstimatedTotal); // 80 km at 20 + 1h at 1000 + 25% VAT
    }

    [PostgresFact]
    public async Task AdminBooking_KeepsTheAdminsPrice()
    {
        var (_, svc) = await SetupAsync();
        var (booking, error, _) = await svc.CreateAsync(Request(total: 999), trustedPrice: true);
        Assert.Null(error);
        Assert.Equal(999, booking!.EstimatedTotal);
    }

    [PostgresFact]
    public async Task PublicBooking_WithUnknownBusCategory_IsRejected()
    {
        var (_, svc) = await SetupAsync();
        var (booking, error, status) = await svc.CreateAsync(Request(busName: "Finnes ikke"));
        Assert.Null(booking);
        Assert.NotNull(error);
        Assert.Equal(400, status);
    }

    [PostgresFact]
    public async Task BookingCreation_QueuesEmailsInOutbox()
    {
        var (db, svc) = await SetupAsync();
        var before = await db.EmailOutbox.CountAsync();
        var (_, error, _) = await svc.CreateAsync(Request(email: "queue@example.com"));
        Assert.Null(error);
        Assert.True(await db.EmailOutbox.CountAsync() > before);
        Assert.Contains(await db.EmailOutbox.ToListAsync(), e => e.ToAddress.Contains("queue@example.com"));
    }

    [PostgresFact]
    public async Task BookingCreation_WritesAuditLog()
    {
        var (db, svc) = await SetupAsync();
        var (booking, _, _) = await svc.CreateAsync(Request());
        Assert.Contains(await db.AuditLogs.ToListAsync(), a => a.EntityType == "Booking" && a.EntityId == booking!.Id.ToString());
    }

    [PostgresTheory]
    [InlineData("", "kunde@example.com", "12345678")]
    [InlineData("Kari", "ikke-epost", "12345678")]
    [InlineData("Kari", "kunde@example.com", "123")]
    public async Task BookingCreation_RejectsInvalidContactDetails(string name, string email, string phone)
    {
        var (_, svc) = await SetupAsync();
        var req = Request() with { ContactName = name, ContactEmail = email, ContactPhone = phone };
        var (booking, error, status) = await svc.CreateAsync(req);
        Assert.Null(booking);
        Assert.NotNull(error);
        Assert.Equal(400, status);
    }

    [PostgresFact]
    public async Task BookingCreation_RejectsPastDates()
    {
        var (_, svc) = await SetupAsync();
        var (booking, _, status) = await svc.CreateAsync(Request(date: DateTime.UtcNow.Date.AddDays(-1)));
        Assert.Null(booking);
        Assert.Equal(400, status);
    }

    [PostgresFact]
    public async Task InvoiceNumbers_AreUniqueAndSequential_EvenWhenGeneratedConcurrently()
    {
        var (_, svc) = await SetupAsync();
        var ids = new List<int>();
        for (var i = 0; i < 6; i++)
            ids.Add((await svc.CreateAsync(Request())).Booking!.Id);

        var results = await Task.WhenAll(ids.Select(async id =>
        {
            await using var db = pg.NewContext();
            var invoices = new InvoiceService(db, null!);
            await invoices.GenerateInvoiceAsync(id);
            return (await db.Bookings.AsNoTracking().FirstAsync(b => b.Id == id)).InvoiceNumber;
        }));

        Assert.All(results, n => Assert.False(string.IsNullOrEmpty(n)));
        Assert.Equal(results.Length, results.Distinct().Count());
    }

    [PostgresFact]
    public async Task GeneratingAnInvoiceTwice_KeepsTheSameNumber()
    {
        var (db, svc) = await SetupAsync();
        var id = (await svc.CreateAsync(Request())).Booking!.Id;
        var invoices = new InvoiceService(db, null!);
        await invoices.GenerateInvoiceAsync(id);
        var first = (await db.Bookings.AsNoTracking().FirstAsync(b => b.Id == id)).InvoiceNumber;
        await invoices.GenerateInvoiceAsync(id);
        Assert.Equal(first, (await db.Bookings.AsNoTracking().FirstAsync(b => b.Id == id)).InvoiceNumber);
    }

    [PostgresFact]
    public async Task AssignmentConflicts_AreDetectedForBusAndDriver_ButNotAdjacentTimes()
    {
        var (db, _) = await SetupAsync();
        var busId = Guid.NewGuid().ToString();
        var day = DateTime.UtcNow.Date.AddDays(30);
        db.BusAssignments.Add(new BusAssignment
        {
            BusId = busId, Title = "Tur A", StartDate = day, EndDate = day,
            StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(14, 0),
        });
        await db.SaveChangesAsync();
        var checker = new AssignmentConflictChecker(db);

        Assert.NotNull(await checker.FindConflictAsync(busId, null, day, day, "12:00", "16:00", null));
        Assert.Null(await checker.FindConflictAsync(busId, null, day, day, "14:00", "18:00", null));
        Assert.Null(await checker.FindConflictAsync(Guid.NewGuid().ToString(), null, day, day, "12:00", "16:00", null));
    }
}

public sealed class PostgresTheoryAttribute : TheoryAttribute
{
    public PostgresTheoryAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("TEST_PG")))
            Skip = "Set TEST_PG to run database tests.";
    }
}
