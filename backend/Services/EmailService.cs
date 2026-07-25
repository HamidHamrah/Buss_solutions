using MailKit.Net.Smtp;
using MimeKit;
using BusSolutionApi.Data;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Services;

public class EmailSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromAddress { get; set; } = "";
    public string FromName { get; set; } = "";
    public string NotifyTo { get; set; } = "";
}

public record CompanyInfo(string Name, string Phone, string Email, string Domain);

public class EmailService(EmailSettings settings, AppDbContext db, ILogger<EmailService> logger)
{
    // ── Shared layout ──────────────────────────────────────────────────────────
    private static string Wrap(string bodyHtml, CompanyInfo company, string previewText = "")
    {
        var preview = string.IsNullOrWhiteSpace(previewText) ? ""
            : $"<div style=\"display:none;max-height:0;overflow:hidden;mso-hide:all\">{previewText}</div>";
        return "<!DOCTYPE html>" +
            "<html lang=\"nb\"><head>" +
            "<meta charset=\"UTF-8\"/>" +
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>" +
            $"<title>{company.Name}</title>" +
            "</head>" +
            "<body style=\"margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%\">" +
            preview +
            "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#f4f5f7;padding:32px 0\">" +
            "<tr><td align=\"center\">" +
            "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)\">" +
            "<tr><td style=\"background-color:#1a3a5c;padding:28px 40px;text-align:center\">" +
            $"<p style=\"margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:1px\">{company.Name.ToUpperInvariant()}</p>" +
            "</td></tr>" +
            "<tr><td style=\"padding:36px 40px 28px\">" +
            bodyHtml +
            "</td></tr>" +
            "<tr><td style=\"background-color:#f8f9fb;border-top:1px solid #e8eaed;padding:20px 40px;text-align:center\">" +
            "<p style=\"margin:0;font-size:12px;color:#6b7280\">" +
            $"<strong>{company.Name}</strong> &nbsp;|&nbsp; Tlf: {company.Phone} &nbsp;|&nbsp;" +
            $"<a href=\"mailto:{company.Email}\" style=\"color:#1a3a5c;text-decoration:none\">{company.Email}</a>" +
            "</p>" +
            (string.IsNullOrWhiteSpace(company.Domain) ? "" :
            "<p style=\"margin:6px 0 0;font-size:11px;color:#9ca3af\">" +
            $"<a href=\"{company.Domain}\" style=\"color:#9ca3af;text-decoration:none\">{company.Domain}</a>" +
            "</p>") +
            "</td></tr>" +
            "</table>" +
            "</td></tr></table>" +
            "</body></html>";
    }

    private static string InfoTable(IEnumerable<(string Label, string Value)> rows)
    {
        var cells = string.Concat(rows.Select(r => $"""
            <tr>
              <td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top">{r.Label}</td>
              <td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:600">{r.Value}</td>
            </tr>
            """));
        return $"""
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin:16px 0">
              {cells}
            </table>
            """;
    }

    private static string H2(string text) =>
        $"<h2 style=\"margin:0 0 8px;font-size:20px;color:#1a3a5c\">{text}</h2>";

    private static string P(string html) =>
        $"<p style=\"margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151\">{html}</p>";

    private static string Divider() =>
        "<hr style=\"border:none;border-top:1px solid #e5e7eb;margin:20px 0\"/>";

    // ── Customer: booking confirmation ─────────────────────────────────────────
    public async Task SendBookingConfirmationAsync(
        string toEmail, string toName, string reference,
        string fromAddress, string toAddress, DateTime departureDate, string busName, decimal total,
        string? tripType = null, DateTime? returnDate = null,
        List<string>? stops = null, bool needsTrailer = false, bool needsWheelchair = false,
        List<string>? selectedExtras = null, int passengers = 0, decimal vatPercent = 12)
    {
        var company = await GetCompanyInfoAsync();
        var vatAmount = Math.Round(total * vatPercent / (100 + vatPercent), 2);
        var exVat = total - vatAmount;

        var rows = new List<(string, string)>
        {
            ("Referanse", reference),
            ("Fra", fromAddress),
            ("Til", toAddress),
            ("Avreisedato", departureDate.ToString("dd.MM.yyyy")),
        };

        if (tripType == "return" && returnDate.HasValue)
            rows.Add(("Returdato", returnDate.Value.ToString("dd.MM.yyyy")));
        if (passengers > 0)
            rows.Add(("Antall passasjerer", passengers.ToString()));

        rows.Add(("Buss", busName));

        var extrasList = new List<string>();
        if (needsTrailer) extrasList.Add("Tilhenger");
        if (needsWheelchair) extrasList.Add("Rullestolrampe");
        if (selectedExtras?.Count > 0) extrasList.AddRange(selectedExtras);
        if (extrasList.Count > 0)
            rows.Add(("Tillegg", string.Join(", ", extrasList)));

        var stopsList = stops?.Where(s => !s.StartsWith("[Retur]")).ToList();
        if (stopsList?.Count > 0)
            rows.Add(("Stopp", string.Join(" → ", stopsList)));

        var body = $"""
            {H2($"Takk for din forespørsel, {toName}!")}
            {P("Vi har mottatt din bestillingsforespørsel og vil kontakte deg snarest med bekreftelse og detaljert tilbud.")}
            {InfoTable(rows)}
            {Divider()}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">
              <tr>
                <td style="font-size:13px;color:#6b7280;padding:4px 0">Estimert pris eks. MVA ({vatPercent}%)</td>
                <td style="font-size:13px;color:#374151;text-align:right;padding:4px 0">{exVat:N0} kr</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6b7280;padding:4px 0">MVA ({vatPercent}%)</td>
                <td style="font-size:13px;color:#374151;text-align:right;padding:4px 0">{vatAmount:N0} kr</td>
              </tr>
              <tr>
                <td style="font-size:15px;font-weight:700;color:#1a3a5c;padding:8px 0 4px;border-top:2px solid #1a3a5c">Estimert total inkl. MVA</td>
                <td style="font-size:15px;font-weight:700;color:#1a3a5c;text-align:right;padding:8px 0 4px;border-top:2px solid #1a3a5c">{total:N0} kr</td>
              </tr>
            </table>
            {P("Prisen er et estimat basert på oppgitt informasjon. Endelig faktura sendes etter gjennomført tur.")}
            """;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(company.Name, settings.FromAddress));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = $"Bestillingsforespørsel mottatt – {reference}";
        message.Body = new TextPart("html") { Text = Wrap(body, company, $"Referanse {reference} er registrert.") };
        await SendAsync(message);
    }

    // ── Internal: new booking notification ────────────────────────────────────
    public async Task SendBookingNotificationAsync(
        string reference, string contactName, string contactEmail, string contactPhone,
        string fromAddress, string toAddress, DateTime departureDate, string busName, decimal total)
    {
        var company = await GetCompanyInfoAsync();
        var rows = new (string, string)[]
        {
            ("Referanse", reference),
            ("Navn", contactName),
            ("E-post", contactEmail),
            ("Telefon", contactPhone),
            ("Fra", fromAddress),
            ("Til", toAddress),
            ("Avreisedato", departureDate.ToString("dd.MM.yyyy")),
            ("Buss", busName),
            ("Estimert total", $"{total:N0} kr inkl. MVA"),
        };

        var body = $"""
            {H2("Ny bestillingsforespørsel")}
            {P("En ny forespørsel er mottatt via nettsiden.")}
            {InfoTable(rows)}
            """;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(company.Name, settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(string.IsNullOrWhiteSpace(settings.NotifyTo) ? settings.FromAddress : settings.NotifyTo));
        message.Subject = $"Ny bestilling – {reference}";
        message.Body = new TextPart("html") { Text = Wrap(body, company) };
        await SendAsync(message);
    }

    // ── Customer: contact form receipt ─────────────────────────────────────────
    public async Task SendContactConfirmationAsync(string toEmail, string toName, string subject)
    {
        var company = await GetCompanyInfoAsync();
        var body = $"""
            {H2($"Takk for din henvendelse, {toName}!")}
            {P("Vi har mottatt meldingen din og vil svare deg så snart som mulig, normalt innen 2 arbeidstimer.")}
            {InfoTable([("Emne", subject)])}
            """;

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(company.Name, settings.FromAddress));
        msg.To.Add(new MailboxAddress(toName, toEmail));
        msg.Subject = $"Vi har mottatt din melding – {subject}";
        msg.Body = new TextPart("html") { Text = Wrap(body, company, "Vi har mottatt din henvendelse.") };
        await SendAsync(msg);
    }

    // ── Internal: contact form notification ───────────────────────────────────
    public async Task SendContactNotificationAsync(string name, string email, string phone, string subject, string messageText)
    {
        var company = await GetCompanyInfoAsync();
        var rows = new (string, string)[]
        {
            ("Navn", name),
            ("E-post", email),
            ("Telefon", phone),
            ("Emne", subject),
        };

        var body = $"""
            {H2("Ny kontaktmelding fra nettsiden")}
            {InfoTable(rows)}
            {Divider()}
            <div style="background-color:#f8f9fb;border-left:3px solid #1a3a5c;padding:14px 16px;border-radius:0 4px 4px 0;font-size:14px;color:#374151;line-height:1.6">
              {messageText.Replace("\n", "<br/>")}
            </div>
            """;

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(company.Name, settings.FromAddress));
        msg.To.Add(MailboxAddress.Parse(string.IsNullOrWhiteSpace(settings.NotifyTo) ? settings.FromAddress : settings.NotifyTo));
        msg.Subject = $"Ny kontaktmelding: {subject}";
        msg.Body = new TextPart("html") { Text = Wrap(body, company) };
        await SendAsync(msg);
    }

    // ── Customer: contact reply ────────────────────────────────────────────────
    public async Task SendContactReplyAsync(string toEmail, string toName, string subject, string replyText)
    {
        var company = await GetCompanyInfoAsync();
        var body = $"""
            {P($"Hei {toName},")}
            <div style="background-color:#f8f9fb;border-left:3px solid #1a3a5c;padding:14px 16px;border-radius:0 4px 4px 0;font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px">
              {replyText.Replace("\n", "<br/>")}
            </div>
            """;

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(company.Name, settings.FromAddress));
        msg.To.Add(new MailboxAddress(toName, toEmail));
        msg.Subject = $"Re: {subject}";
        msg.Body = new TextPart("html") { Text = Wrap(body, company) };
        await SendAsync(msg);
    }

    // ── Customer: trip started — tracking link ─────────────────────────────────
    public async Task SendTripStartedAsync(
        string toEmail, string toName,
        string trackingToken, string tripTitle,
        string? fromAddress, string? toAddress, string? startTime)
    {
        var company = await GetCompanyInfoAsync();
        var domain = string.IsNullOrWhiteSpace(company.Domain) ? "localhost:3000" : company.Domain;
        var scheme = company.Domain.Contains("localhost") ? "http" : "https";
        var trackingUrl = $"{scheme}://{domain}/sporing/{trackingToken}";

        var rows = new List<(string, string)>();
        if (!string.IsNullOrWhiteSpace(fromAddress)) rows.Add(("Fra", fromAddress));
        if (!string.IsNullOrWhiteSpace(toAddress)) rows.Add(("Til", toAddress));
        if (!string.IsNullOrWhiteSpace(startTime)) rows.Add(("Avgang", startTime));

        var body = $"""
            {H2($"Din buss er på vei, {toName}!")}
            {P("Sjåføren har startet turen. Du kan følge bussens posisjon i sanntid via lenken under.")}
            {InfoTable(rows)}
            <div style="text-align:center;margin:24px 0">
              <a href="{trackingUrl}"
                 style="display:inline-block;background:#1a3a5c;color:#ffffff;font-size:15px;font-weight:600;padding:13px 28px;border-radius:6px;text-decoration:none">
                Følg bussen live
              </a>
            </div>
            {P($"Eller kopier lenken: <a href=\"{trackingUrl}\" style=\"color:#1a3a5c\">{trackingUrl}</a>")}
            {Divider()}
            {P($"Har du spørsmål? Ring oss på <a href=\"tel:{company.Phone}\" style=\"color:#1a3a5c\">{company.Phone}</a>")}
            """;

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(company.Name, settings.FromAddress));
        msg.To.Add(new MailboxAddress(toName, toEmail));
        msg.Subject = $"Din buss er på vei – følg live";
        msg.Body = new TextPart("html") { Text = Wrap(body, company) };
        await SendAsync(msg);
    }

    // ── Infrastructure ─────────────────────────────────────────────────────────
    private async Task<CompanyInfo> GetCompanyInfoAsync()
    {
        var cfg = await db.SiteConfigs.OrderBy(c => c.Id).FirstOrDefaultAsync();
        return new CompanyInfo(
            cfg?.CompanyName ?? settings.FromName,
            cfg?.Phone ?? "",
            cfg?.Email ?? settings.FromAddress,
            cfg?.SiteDomain ?? "");
    }

    private async Task<EmailSettings> ResolveSettingsAsync()
    {
        if (!string.IsNullOrWhiteSpace(settings.Host)) return settings;

        var cfg = await db.SiteConfigs.OrderBy(c => c.Id).FirstOrDefaultAsync();
        if (cfg == null || string.IsNullOrWhiteSpace(cfg.SmtpHost)) return settings;

        return new EmailSettings
        {
            Host = cfg.SmtpHost,
            Port = cfg.SmtpPort,
            Username = cfg.SmtpUsername,
            Password = cfg.SmtpPassword,
            FromAddress = cfg.SmtpFromAddress,
            FromName = cfg.CompanyName,
            NotifyTo = cfg.SmtpNotifyTo,
        };
    }

    private async Task SendAsync(MimeMessage message, EmailSettings? resolved = null)
    {
        var s = resolved ?? await ResolveSettingsAsync();
        if (string.IsNullOrWhiteSpace(s.Host))
        {
            logger.LogWarning("SMTP not configured — email not sent: {Subject}", message.Subject);
            return;
        }
        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(s.Host, s.Port, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(s.Username, s.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email");
        }
    }
}
