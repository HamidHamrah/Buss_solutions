using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;
using BusSolutionApi.Services;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController(AppDbContext db, EmailService email) : ControllerBase
{
    [HttpPost]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("booking")]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req)
    {
        // Input validation
        if (string.IsNullOrWhiteSpace(req.ContactName))
            return BadRequest(new { error = "Navn er påkrevd." });
        if (string.IsNullOrWhiteSpace(req.ContactEmail) || !req.ContactEmail.Contains('@') || !req.ContactEmail.Contains('.'))
            return BadRequest(new { error = "Ugyldig e-postadresse." });
        if (string.IsNullOrWhiteSpace(req.ContactPhone) || req.ContactPhone.Replace(" ", "").Length < 8)
            return BadRequest(new { error = "Ugyldig mobilnummer." });
        if (string.IsNullOrWhiteSpace(req.FromAddress) || string.IsNullOrWhiteSpace(req.ToAddress))
            return BadRequest(new { error = "Fra- og til-adresse er påkrevd." });
        if (req.Passengers < 1 || req.Passengers > 10000)
            return BadRequest(new { error = "Antall passasjerer må være mellom 1 og 10 000." });
        if (req.BusCount < 1 || req.BusCount > 100)
            return BadRequest(new { error = "Antall busser må være mellom 1 og 100." });
        if (req.DepartureDate.Date < DateTime.UtcNow.Date)
            return BadRequest(new { error = "Avreisedato kan ikke være i fortiden." });
        if (req.TripType == "return" && req.ReturnDate.HasValue && req.ReturnDate.Value.Date < req.DepartureDate.Date)
            return BadRequest(new { error = "Returdato må være samme dag eller etter avreisedato." });

        // Double-booking check: reject if the same bus already has a confirmed booking on the same date
        if (!string.IsNullOrEmpty(req.BusId))
        {
            var departureDay = req.DepartureDate.Date;
            var conflict = await db.Bookings
                .AnyAsync(b => b.BusId == req.BusId
                            && b.Status == BookingStatus.Confirmed
                            && b.DepartureDate.Date == departureDay);

            if (conflict)
                return Conflict(new { error = "Denne bussen er allerede bekreftet booket på den valgte datoen. Velg en annen dato eller busstype." });
        }

        var reference = $"NTR-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

        var booking = new Booking
        {
            Reference = reference,
            FromAddress = req.FromAddress,
            ToAddress = req.ToAddress,
            Stops = req.Stops,
            DepartureDate = req.DepartureDate,
            DepartureTime = req.DepartureTime,
            TripType = req.TripType,
            ReturnDate = req.ReturnDate,
            ReturnTime = req.ReturnTime ?? "",
            BusOnStay = req.BusOnStay,
            StayDurationHours = req.StayDurationHours,
            BusId = req.BusId,
            BusName = req.BusName,
            Passengers = req.Passengers,
            BusCount = req.BusCount,
            NeedsTrailer = req.NeedsTrailer,
            NeedsWheelchair = req.NeedsWheelchair,
            SelectedExtras = req.SelectedExtras,
            EstimatedBase = req.EstimatedBase,
            EstimatedVat = req.EstimatedVat,
            EstimatedTotal = req.EstimatedTotal,
            PriceAdjustment = req.PriceAdjustment ?? 0,
            PriceAdjustmentNote = req.PriceAdjustmentNote,
            DistanceKm = req.DistanceKm,
            CustomerType = req.CustomerType,
            ContactName = req.ContactName,
            ContactEmail = req.ContactEmail,
            ContactPhone = req.ContactPhone,
            OrgName = req.OrgName,
            OrgNumber = req.OrgNumber,
            Message = req.Message
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        // Send emails (fire-and-forget is fine here)
        var vatPct = (await db.SiteConfigs.OrderBy(c => c.Id).FirstOrDefaultAsync())?.VatPercent ?? 12;
        _ = email.SendBookingConfirmationAsync(booking.ContactEmail, booking.ContactName, reference,
            booking.FromAddress, booking.ToAddress, booking.DepartureDate, booking.BusName, booking.EstimatedTotal,
            booking.TripType, booking.ReturnDate, booking.Stops,
            booking.NeedsTrailer, booking.NeedsWheelchair, booking.SelectedExtras,
            booking.Passengers, vatPct);
        _ = email.SendBookingNotificationAsync(reference, booking.ContactName, booking.ContactEmail,
            booking.ContactPhone, booking.FromAddress, booking.ToAddress, booking.DepartureDate,
            booking.BusName, booking.EstimatedTotal);

        return Ok(new { reference });
    }

    [HttpGet("lookup/{reference}")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("booking")]
    public async Task<IActionResult> Lookup(string reference)
    {
        var booking = await db.Bookings
            .Where(b => b.Reference == reference.ToUpper())
            .FirstOrDefaultAsync();

        if (booking == null) return NotFound(new { error = "Bestillingen ble ikke funnet." });

        // Return only the fields safe to expose publicly
        return Ok(new
        {
            id           = booking.Id,
            reference    = booking.Reference,
            status       = booking.Status.ToString(),
            fromAddress  = booking.FromAddress,
            toAddress    = booking.ToAddress,
            departureDate = booking.DepartureDate,
            departureTime = booking.DepartureTime,
            returnDate    = booking.ReturnDate,
            returnTime    = booking.ReturnTime,
            tripType      = booking.TripType,
            busName        = booking.BusName,
            passengers     = booking.Passengers,
            busCount       = booking.BusCount,
            estimatedTotal = booking.EstimatedTotal,
            contactName    = booking.ContactName,
            createdAt      = booking.CreatedAt,
            stops          = booking.Stops,
            needsTrailer   = booking.NeedsTrailer,
            needsWheelchair = booking.NeedsWheelchair,
            selectedExtras = booking.SelectedExtras,
        });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var total = await db.Bookings.CountAsync();
        var bookings = await db.Bookings
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, page, pageSize, bookings });
    }

    // Bookings that still need a kjøreordre (BusAssignment) scheduled — surfaced in the
    // Planlegger calendar so new orders don't require a manual trip to Bestillinger first.
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("unplanned")]
    public async Task<IActionResult> GetUnplanned()
    {
        var plannedBookingIds = db.BusAssignments
            .Where(a => a.BookingId != null)
            .Select(a => a.BookingId!.Value);

        var bookings = await db.Bookings
            .Where(b => b.Status != BookingStatus.Cancelled && !plannedBookingIds.Contains(b.Id))
            .OrderBy(b => b.DepartureDate)
            .Select(b => new
            {
                b.Id, b.Reference, b.ContactName, b.ContactPhone,
                b.FromAddress, b.ToAddress, b.DepartureDate, b.DepartureTime,
                b.TripType, b.ReturnDate, b.ReturnTime, b.Stops,
                b.Passengers, b.BusCount, b.EstimatedTotal, b.Status,
            })
            .ToListAsync();

        return Ok(bookings);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var all = await db.Bookings.ToListAsync();
        var now = DateTime.UtcNow;

        // Bookings per month — last 6 months
        var months = Enumerable.Range(0, 6)
            .Select(i => now.AddMonths(-5 + i))
            .Select(d => new DateTime(d.Year, d.Month, 1))
            .ToList();

        var perMonth = months.Select(m => new
        {
            month = m.ToString("MMM", new System.Globalization.CultureInfo("nb-NO")),
            new_     = all.Count(b => b.CreatedAt.Year == m.Year && b.CreatedAt.Month == m.Month && b.Status == BookingStatus.New),
            confirmed = all.Count(b => b.CreatedAt.Year == m.Year && b.CreatedAt.Month == m.Month && b.Status == BookingStatus.Confirmed),
            cancelled = all.Count(b => b.CreatedAt.Year == m.Year && b.CreatedAt.Month == m.Month && b.Status == BookingStatus.Cancelled),
            revenue   = all.Where(b => b.CreatedAt.Year == m.Year && b.CreatedAt.Month == m.Month && b.Status == BookingStatus.Confirmed)
                           .Sum(b => b.EstimatedTotal),
        });

        // KPI totals
        var confirmed = all.Where(b => b.Status == BookingStatus.Confirmed).ToList();
        var thisMonth = all.Where(b => b.CreatedAt.Year == now.Year && b.CreatedAt.Month == now.Month).ToList();
        var lastMonth = all.Where(b => b.CreatedAt.Year == now.AddMonths(-1).Year && b.CreatedAt.Month == now.AddMonths(-1).Month).ToList();

        // Popular buses
        var byBus = all.GroupBy(b => b.BusName)
            .Select(g => new { bus = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(5);

        return Ok(new
        {
            totals = new
            {
                all        = all.Count,
                newCount   = all.Count(b => b.Status == BookingStatus.New),
                confirmed  = confirmed.Count,
                cancelled  = all.Count(b => b.Status == BookingStatus.Cancelled),
                revenue    = confirmed.Sum(b => b.EstimatedTotal),
                thisMonth  = thisMonth.Count,
                lastMonth  = lastMonth.Count,
            },
            perMonth,
            byBus,
        });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return NotFound();
        booking.Status = req.Status;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(booking);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/invoice")]
    public async Task<IActionResult> GenerateInvoice(int id)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return NotFound();

        // If already has invoice number, return it (idempotent)
        if (!string.IsNullOrEmpty(booking.InvoiceNumber))
            return Ok(new { invoiceNumber = booking.InvoiceNumber, invoiceDate = booking.InvoiceDate });

        // Sequential invoice number: year + zero-padded sequence
        var year = DateTime.UtcNow.Year;
        var countThisYear = await db.Bookings
            .CountAsync(b => b.InvoiceNumber != null && b.InvoiceDate.HasValue && b.InvoiceDate.Value.Year == year);
        var invoiceNumber = $"{year}-{(countThisYear + 1):D4}";

        booking.InvoiceNumber = invoiceNumber;
        booking.InvoiceDate = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { invoiceNumber = booking.InvoiceNumber, invoiceDate = booking.InvoiceDate });
    }

    // Ledger of every generated invoice (bookings with an InvoiceNumber set) — the
    // dedicated view for tracking which invoices are still owed vs. settled, separate
    // from the booking-status (new/confirmed/cancelled) list.
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] string? status = null)
    {
        var query = db.Bookings.Where(b => b.InvoiceNumber != null);
        if (status == "paid") query = query.Where(b => b.PaymentStatus == PaymentStatus.Paid);
        else if (status == "unpaid") query = query.Where(b => b.PaymentStatus == PaymentStatus.Unpaid);

        var invoices = await query
            .OrderByDescending(b => b.InvoiceDate)
            .Select(b => new
            {
                b.Id,
                b.Reference,
                b.InvoiceNumber,
                b.InvoiceDate,
                b.ContactName,
                b.OrgName,
                b.EstimatedTotal,
                b.PaymentStatus,
                b.PaidDate,
            })
            .ToListAsync();

        return Ok(invoices);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/payment-status")]
    public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusRequest req)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return NotFound();
        if (string.IsNullOrEmpty(booking.InvoiceNumber))
            return BadRequest(new { error = "Bestillingen har ingen faktura ennå." });

        booking.PaymentStatus = req.PaymentStatus;
        booking.PaidDate = req.PaymentStatus == PaymentStatus.Paid ? DateTime.UtcNow : null;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { booking.PaymentStatus, booking.PaidDate });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/notes")]
    public async Task<IActionResult> UpdateNotes(int id, [FromBody] UpdateNotesRequest req)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return NotFound();
        booking.AdminNotes = req.Notes;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { notes = booking.AdminNotes });
    }

    // Lets an admin add a manual adjustment (positive or negative) on top of the
    // calculated EstimatedBase/EstimatedVat baseline — the baseline itself is never
    // edited here, only the delta, so the original calculation stays visible/auditable.
    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/price")]
    public async Task<IActionResult> UpdatePrice(int id, [FromBody] UpdatePriceRequest req)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return NotFound();
        booking.PriceAdjustment = req.PriceAdjustment;
        booking.PriceAdjustmentNote = req.PriceAdjustmentNote;
        booking.EstimatedTotal = booking.EstimatedBase + booking.EstimatedVat + req.PriceAdjustment;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { booking.EstimatedBase, booking.EstimatedVat, booking.PriceAdjustment, booking.PriceAdjustmentNote, booking.EstimatedTotal });
    }
}

public record UpdateNotesRequest(string? Notes);
public record UpdatePriceRequest(decimal PriceAdjustment, string? PriceAdjustmentNote);
public record UpdatePaymentStatusRequest(PaymentStatus PaymentStatus);

public record CreateBookingRequest(
    string FromAddress, string ToAddress, List<string> Stops,
    DateTime DepartureDate, string DepartureTime, string TripType,
    bool BusOnStay, int? StayDurationHours,
    DateTime? ReturnDate, string? ReturnTime,
    string BusId, string BusName, int Passengers, int BusCount,
    bool NeedsTrailer, bool NeedsWheelchair, List<string> SelectedExtras,
    decimal EstimatedBase, decimal EstimatedVat, decimal EstimatedTotal, int DistanceKm,
    string CustomerType, string ContactName, string ContactEmail, string ContactPhone,
    string? OrgName, string? OrgNumber, string? Message,
    decimal? PriceAdjustment = null, string? PriceAdjustmentNote = null
);

public record UpdateStatusRequest(BookingStatus Status);
