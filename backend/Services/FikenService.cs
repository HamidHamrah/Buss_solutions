using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BusSolutionApi.Models;

namespace BusSolutionApi.Services;

/// <summary>
/// Wraps the Fiken REST API (https://api.fiken.no/api/v2/docs).
/// Credentials come from SiteConfig — never hardcoded.
/// </summary>
public class FikenService(IHttpClientFactory httpFactory, ILogger<FikenService> logger)
{
    private const string BaseUrl = "https://api.fiken.no/api/v2";

    // ── helpers ──────────────────────────────────────────────────────────────

    private HttpClient Client(string apiToken)
    {
        var client = httpFactory.CreateClient("fiken");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return client;
    }

    private static StringContent Json(object obj) =>
        new(JsonSerializer.Serialize(obj, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
            Encoding.UTF8, "application/json");

    // ── public surface ───────────────────────────────────────────────────────

    /// <summary>
    /// Push a booking to Fiken as a draft sale/invoice.
    /// Returns the Fiken invoice ID (stored on the Booking for webhook matching).
    /// </summary>
    /// <summary>
    /// Creates a draft sale/invoice in Fiken — does NOT email the customer. Call
    /// SendInvoiceAsync separately once the admin has reviewed/finalized the booking.
    /// Returns the Fiken invoice ID (stored on the Booking for webhook matching + sending).
    /// </summary>
    public async Task<string?> CreateDraftInvoiceAsync(Booking booking, SiteConfig config)
    {
        if (!IsConfigured(config))
        {
            logger.LogWarning("Fiken not configured — skipping sync for booking {Id}", booking.Id);
            return null;
        }

        var client = Client(config.FikenApiToken!);
        var slug = config.FikenCompanySlug!;

        // 1. Upsert customer
        var customerId = await UpsertCustomerAsync(client, slug, booking);
        if (customerId == null)
        {
            logger.LogError("Fiken: could not upsert customer for booking {Id}", booking.Id);
            return null;
        }

        // 2. Create invoice (draft)
        var vatAmount = Math.Round(booking.EstimatedVat, 2);
        var netAmount = Math.Round(booking.EstimatedTotal - vatAmount, 2);

        var invoicePayload = new
        {
            issueDate = (booking.InvoiceDate ?? DateTime.UtcNow).ToString("yyyy-MM-dd"),
            dueDate = (booking.InvoiceDate ?? DateTime.UtcNow).AddDays(14).ToString("yyyy-MM-dd"),
            customerId,
            ourReference = booking.InvoiceNumber,
            yourReference = booking.Reference,
            lines = new[]
            {
                new
                {
                    description = $"Bussreise {booking.FromAddress} – {booking.ToAddress} ({booking.DepartureDate:dd.MM.yyyy})",
                    netAmount = (long)(netAmount * 100),   // Fiken uses øre (int)
                    vatAmount = (long)(vatAmount * 100),
                    vatType = "HIGH",                      // 25 % MVA
                    account = "3000",
                    quantity = 1,
                    unitPrice = (long)(netAmount * 100),
                }
            },
            currency = "NOK",
        };

        var resp = await client.PostAsync($"{BaseUrl}/companies/{slug}/invoices/drafts", Json(invoicePayload));
        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadAsStringAsync();
            logger.LogError("Fiken createInvoice failed {Status}: {Body}", resp.StatusCode, body);
            return null;
        }

        // Fiken returns the draft URL in Location header; extract numeric ID
        var location = resp.Headers.Location?.ToString() ?? "";
        return location.Split('/').LastOrDefault(s => long.TryParse(s, out _));
    }

    /// <summary>
    /// Moves an existing Fiken draft to sent — this is the step that actually emails the
    /// customer. Returns true on success.
    /// </summary>
    public async Task<bool> SendInvoiceAsync(string fikenId, Booking booking, SiteConfig config)
    {
        if (!IsConfigured(config)) return false;

        var client = Client(config.FikenApiToken!);
        var slug = config.FikenCompanySlug!;

        var sendPayload = new
        {
            invoiceId = long.Parse(fikenId),
            method = "email",
            includeDocumentAttachments = false,
            recipientEmail = booking.ContactEmail,
            recipientName = booking.ContactName,
            message = $"Faktura for bussreise — ref. {booking.Reference}",
            emailSendOption = "auto",
        };
        var sendResp = await client.PostAsync($"{BaseUrl}/companies/{slug}/invoices/{fikenId}/send", Json(sendPayload));
        if (!sendResp.IsSuccessStatusCode)
        {
            var body = await sendResp.Content.ReadAsStringAsync();
            logger.LogWarning("Fiken sendInvoice failed {Status}: {Body}", sendResp.StatusCode, body);
            return false;
        }
        return true;
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private async Task<long?> UpsertCustomerAsync(HttpClient client, string slug, Booking booking)
    {
        // Search by org number if company booking, else by email
        var searchParam = !string.IsNullOrWhiteSpace(booking.OrgNumber)
            ? $"organizationNumber={Uri.EscapeDataString(booking.OrgNumber)}"
            : $"email={Uri.EscapeDataString(booking.ContactEmail)}";

        var search = await client.GetAsync($"{BaseUrl}/companies/{slug}/contacts?{searchParam}");
        if (search.IsSuccessStatusCode)
        {
            var json = await search.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
            {
                var first = doc.RootElement[0];
                if (first.TryGetProperty("contactId", out var idProp) && idProp.TryGetInt64(out var existing))
                    return existing;
            }
        }

        // Create new contact
        var payload = new
        {
            name = booking.OrgName ?? booking.ContactName,
            email = booking.ContactEmail,
            phoneNumber = booking.ContactPhone,
            organizationNumber = booking.OrgNumber,
            customer = true,
            supplier = false,
        };

        var resp = await client.PostAsync($"{BaseUrl}/companies/{slug}/contacts", Json(payload));
        if (!resp.IsSuccessStatusCode) return null;

        var location = resp.Headers.Location?.ToString() ?? "";
        var idStr = location.Split('/').LastOrDefault(s => long.TryParse(s, out _));
        return long.TryParse(idStr, out var newId) ? newId : null;
    }

    public static bool IsConfigured(SiteConfig config) =>
        !string.IsNullOrWhiteSpace(config.FikenApiToken) &&
        !string.IsNullOrWhiteSpace(config.FikenCompanySlug);
}
