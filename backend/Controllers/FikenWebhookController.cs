using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

/// <summary>
/// Receives payment-paid events from Fiken and marks the matching booking as paid.
/// Fiken sends a POST to this endpoint when an invoice is settled.
/// Register the webhook URL in Fiken: Settings → Integrations → Webhooks
/// URL: https://your-domain/api/fiken/webhook
/// Events: invoices/paid
/// </summary>
[ApiController]
[Route("api/fiken")]
public class FikenWebhookController(AppDbContext db, ILogger<FikenWebhookController> logger) : ControllerBase
{
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();
        logger.LogInformation("Fiken webhook received: {Body}", body);

        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            // Fiken webhook payload shape: { "event": "invoices/paid", "invoiceId": 12345, ... }
            if (!root.TryGetProperty("event", out var eventProp)) return Ok();
            var eventName = eventProp.GetString();

            if (eventName is not ("invoices/paid" or "invoice/paid")) return Ok();

            if (!root.TryGetProperty("invoiceId", out var idProp)) return Ok();
            var fikenId = idProp.GetInt64().ToString();

            var booking = await db.Bookings.FirstOrDefaultAsync(b => b.FikenInvoiceId == fikenId);
            if (booking == null)
            {
                logger.LogWarning("Fiken webhook: no booking found for FikenInvoiceId={Id}", fikenId);
                return Ok();
            }

            if (booking.PaymentStatus != PaymentStatus.Paid)
            {
                booking.PaymentStatus = PaymentStatus.Paid;
                booking.PaidDate = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;
                db.BookingActivities.Add(new BookingActivity { BookingId = booking.Id, Type = "payment", Message = "Betaling mottatt via Fiken" });
                await db.SaveChangesAsync();
                logger.LogInformation("Booking {Ref} marked paid via Fiken webhook", booking.Reference);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Fiken webhook");
        }

        // Always return 200 so Fiken doesn't retry indefinitely
        return Ok();
    }
}
