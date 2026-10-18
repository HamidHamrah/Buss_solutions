using BusSolutionApi.Data;
using BusSolutionApi.Models;
using BusSolutionApi.Services;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Application.Invoices;

public class InvoiceService(AppDbContext db, FikenService fiken)
{
    public async Task<object?> GenerateInvoiceAsync(int id)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return null;

        if (!string.IsNullOrEmpty(booking.InvoiceNumber))
            return new { invoiceNumber = booking.InvoiceNumber, invoiceDate = booking.InvoiceDate };

        await GenerateInvoiceForBookingAsync(booking);
        db.BookingActivities.Add(new BookingActivity { BookingId = id, Type = "invoice", Message = $"Faktura {booking.InvoiceNumber} opprettet" });
        await db.SaveChangesAsync();

        return new { invoiceNumber = booking.InvoiceNumber, invoiceDate = booking.InvoiceDate };
    }

    public async Task<(object? Result, string? Error, int StatusCode)> SendInvoiceAsync(int id)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return (null, null, 404);
        if (string.IsNullOrEmpty(booking.InvoiceNumber))
            return (null, "Faktura må genereres først.", 400);
        if (booking.InvoiceSentAt != null)
            return (new { sentAt = booking.InvoiceSentAt, fikenInvoiceId = booking.FikenInvoiceId }, null, 200);

        var config = await db.SiteConfigs.FirstOrDefaultAsync();
        if (config == null || !FikenService.IsConfigured(config))
            return (null, "Fiken er ikke konfigurert — kan ikke sende faktura.", 400);

        var sentAt = DateTime.UtcNow;
        var claimed = await db.Bookings
            .Where(b => b.Id == id && b.InvoiceSentAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(b => b.InvoiceSentAt, sentAt).SetProperty(b => b.UpdatedAt, sentAt));
        if (claimed == 0)
        {
            await db.Entry(booking).ReloadAsync();
            return (new { sentAt = booking.InvoiceSentAt, fikenInvoiceId = booking.FikenInvoiceId }, null, 200);
        }

        var fikenId = booking.FikenInvoiceId ?? await fiken.CreateDraftInvoiceAsync(booking, config);
        if (fikenId == null)
        {
            await db.Bookings.Where(b => b.Id == id).ExecuteUpdateAsync(s => s.SetProperty(b => b.InvoiceSentAt, (DateTime?)null));
            return (null, "Kunne ikke opprette faktura i Fiken. Prøv igjen.", 502);
        }

        var sent = await fiken.SendInvoiceAsync(fikenId, booking, config);
        if (!sent)
        {
            await db.Bookings.Where(b => b.Id == id).ExecuteUpdateAsync(s => s.SetProperty(b => b.InvoiceSentAt, (DateTime?)null));
            return (null, "Faktura ble opprettet i Fiken, men kunne ikke sendes. Prøv igjen.", 502);
        }

        booking.FikenInvoiceId = fikenId;
        booking.FikenSyncedAt = sentAt;
        booking.InvoiceSentAt = sentAt;
        db.BookingActivities.Add(new BookingActivity { BookingId = id, Type = "invoice", Message = $"Faktura {booking.InvoiceNumber} sendt til kunden" });
        await db.SaveChangesAsync();

        return (new { sentAt = booking.InvoiceSentAt, fikenInvoiceId = booking.FikenInvoiceId }, null, 200);
    }

    public async Task<(object? Result, string? Error)> UpdatePaymentStatusAsync(int id, PaymentStatus paymentStatus)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking == null) return (null, null);
        if (string.IsNullOrEmpty(booking.InvoiceNumber))
            return (null, "Bestillingen har ingen faktura ennå.");

        if (booking.PaymentStatus != paymentStatus)
            db.BookingActivities.Add(new BookingActivity { BookingId = id, Type = "payment", Message = paymentStatus == PaymentStatus.Paid ? "Markert som betalt" : "Betaling tilbakestilt" });
        booking.PaymentStatus = paymentStatus;
        booking.PaidDate = paymentStatus == PaymentStatus.Paid ? DateTime.UtcNow : null;
        booking.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return (new { booking.PaymentStatus, booking.PaidDate }, null);
    }

    private async Task GenerateInvoiceForBookingAsync(Booking booking)
    {
        if (!string.IsNullOrEmpty(booking.InvoiceNumber)) return;

        var invoiceDate = DateTime.UtcNow;
        var year = invoiceDate.Year;

        var claimed = 0;
        string invoiceNumber = "";
        for (var attempt = 0; attempt < 10 && claimed == 0; attempt++)
        {
            var countThisYear = await db.Bookings
                .CountAsync(b => b.InvoiceNumber != null && b.InvoiceDate.HasValue && b.InvoiceDate.Value.Year == year);
            invoiceNumber = $"{year}-{(countThisYear + 1):D4}";

            try
            {
                claimed = await db.Bookings
                    .Where(b => b.Id == booking.Id && b.InvoiceNumber == null)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(b => b.InvoiceNumber, invoiceNumber)
                        .SetProperty(b => b.InvoiceDate, invoiceDate)
                        .SetProperty(b => b.UpdatedAt, DateTime.UtcNow));
            }
            catch (Exception ex) when (attempt < 9 && (ex is DbUpdateException || ex is Npgsql.PostgresException { SqlState: "23505" }))
            {
                // Another request took this number first; wait a moment so retries don't collide again.
                await Task.Delay(Random.Shared.Next(5, 40));
            }
        }
        if (claimed == 0) return;

        booking.InvoiceNumber = invoiceNumber;
        booking.InvoiceDate = invoiceDate;
    }
}

