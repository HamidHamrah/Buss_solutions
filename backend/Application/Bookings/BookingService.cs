using BusSolutionApi.Data;
using BusSolutionApi.Models;
using BusSolutionApi.Services;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Application.Bookings;

public class BookingService(
    AppDbContext db,
    EmailService email,
    BookingReferenceGenerator referenceGenerator,
    BookingPricingService pricing)
{
    public async Task<(Booking? Booking, string? Error, int? StatusCode)> CreateAsync(CreateBookingRequest req)
    {
        var validationError = ValidateCreateRequest(req);
        if (validationError != null) return (null, validationError, 400);

        if (!string.IsNullOrEmpty(req.BusId))
        {
            var departureDay = req.DepartureDate.Date;
            var conflict = await db.Bookings
                .AnyAsync(b => b.BusId == req.BusId
                    && b.Status == BookingStatus.Confirmed
                    && b.DepartureDate.Date == departureDay);

            if (conflict)
                return (null, "Denne bussen er allerede bekreftet booket på den valgte datoen. Velg en annen dato eller busstype.", 409);
        }

        var booking = new Booking
        {
            Reference = referenceGenerator.Generate(),
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
            CustomerType = req.CustomerType,
            ContactName = req.ContactName,
            ContactEmail = req.ContactEmail,
            ContactPhone = req.ContactPhone,
            OrgName = req.OrgName,
            OrgNumber = req.OrgNumber,
            Message = req.Message
        };
        pricing.ApplyClientEstimate(booking, req);

        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        var vatPct = (await db.SiteConfigs.OrderBy(c => c.Id).FirstOrDefaultAsync())?.VatPercent ?? 12;
        _ = email.SendBookingConfirmationAsync(booking.ContactEmail, booking.ContactName, booking.Reference,
            booking.FromAddress, booking.ToAddress, booking.DepartureDate, booking.BusName, booking.EstimatedTotal,
            booking.TripType, booking.ReturnDate, booking.Stops,
            booking.NeedsTrailer, booking.NeedsWheelchair, booking.SelectedExtras,
            booking.Passengers, vatPct);
        _ = email.SendBookingNotificationAsync(booking.Reference, booking.ContactName, booking.ContactEmail,
            booking.ContactPhone, booking.FromAddress, booking.ToAddress, booking.DepartureDate,
            booking.BusName, booking.EstimatedTotal);

        return (booking, null, null);
    }

    public async Task<object?> LookupAsync(string reference)
    {
        var booking = await db.Bookings
            .Where(b => b.Reference == reference.ToUpper())
            .FirstOrDefaultAsync();

        if (booking == null) return null;

        return new
        {
            id = booking.Id,
            reference = booking.Reference,
            status = booking.Status.ToString(),
            fromAddress = booking.FromAddress,
            toAddress = booking.ToAddress,
            departureDate = booking.DepartureDate,
            departureTime = booking.DepartureTime,
            returnDate = booking.ReturnDate,
            returnTime = booking.ReturnTime,
            tripType = booking.TripType,
            busName = booking.BusName,
            passengers = booking.Passengers,
            busCount = booking.BusCount,
            estimatedTotal = booking.EstimatedTotal,
            contactName = booking.ContactName,
            createdAt = booking.CreatedAt,
            stops = booking.Stops,
            needsTrailer = booking.NeedsTrailer,
            needsWheelchair = booking.NeedsWheelchair,
            selectedExtras = booking.SelectedExtras,
        };
    }

    public async Task<Booking?> UpdateStatusAsync(int id, BookingStatus status)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return null;

        booking.Status = status;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return booking;
    }

    public async Task<object?> UpdateNotesAsync(int id, string? notes)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return null;

        booking.AdminNotes = notes;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return new { notes = booking.AdminNotes };
    }

    public async Task<(object? Result, string? Error)> UpdatePriceAsync(int id, UpdatePriceRequest req)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return (null, null);
        if (booking.InvoiceSentAt != null)
            return (null, "Fakturaen er allerede sendt — beløpet er låst. Bruk kreditnota for korrigeringer.");

        booking.PriceAdjustment = req.PriceAdjustment;
        booking.PriceAdjustmentNote = req.PriceAdjustmentNote;
        pricing.RecomputeTotal(booking);
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (PriceSummary(booking), null);
    }

    public async Task<(object? Result, string? Error)> AddExtraChargeAsync(int id, ExtraChargeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Description))
            return (null, "Beskrivelse er påkrevd.");

        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return (null, null);
        if (booking.InvoiceSentAt != null)
            return (null, "Fakturaen er allerede sendt — beløpet er låst. Bruk kreditnota for korrigeringer.");

        booking.ExtraCharges.Add(new ExtraCharge { Description = req.Description.Trim(), Amount = req.Amount });
        pricing.RecomputeTotal(booking);
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (new { booking.ExtraCharges, booking.EstimatedTotal }, null);
    }

    public async Task<(object? Result, string? Error)> RemoveExtraChargeAsync(int id, int index)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return (null, null);
        if (index < 0 || index >= booking.ExtraCharges.Count) return (null, null);
        if (booking.InvoiceSentAt != null)
            return (null, "Fakturaen er allerede sendt — beløpet er låst. Bruk kreditnota for korrigeringer.");

        booking.ExtraCharges.RemoveAt(index);
        pricing.RecomputeTotal(booking);
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (new { booking.ExtraCharges, booking.EstimatedTotal }, null);
    }

    private static object PriceSummary(Booking booking) => new
    {
        booking.EstimatedBase,
        booking.EstimatedVat,
        booking.PriceAdjustment,
        booking.PriceAdjustmentNote,
        booking.ExtraCharges,
        booking.EstimatedTotal
    };

    private static string? ValidateCreateRequest(CreateBookingRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ContactName))
            return "Navn er påkrevd.";
        if (string.IsNullOrWhiteSpace(req.ContactEmail) || !req.ContactEmail.Contains('@') || !req.ContactEmail.Contains('.'))
            return "Ugyldig e-postadresse.";
        if (string.IsNullOrWhiteSpace(req.ContactPhone) || req.ContactPhone.Replace(" ", "").Length < 8)
            return "Ugyldig mobilnummer.";
        if (string.IsNullOrWhiteSpace(req.FromAddress) || string.IsNullOrWhiteSpace(req.ToAddress))
            return "Fra- og til-adresse er påkrevd.";
        if (req.Passengers < 1 || req.Passengers > 10000)
            return "Antall passasjerer må være mellom 1 og 10 000.";
        if (req.BusCount < 1 || req.BusCount > 100)
            return "Antall busser må være mellom 1 og 100.";
        if (req.DepartureDate.Date < DateTime.UtcNow.Date)
            return "Avreisedato kan ikke være i fortiden.";
        if (req.TripType == "return" && req.ReturnDate.HasValue && req.ReturnDate.Value.Date < req.DepartureDate.Date)
            return "Returdato må være samme dag eller etter avreisedato.";

        return null;
    }
}

