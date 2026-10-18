using BusSolutionApi.Data;
using Microsoft.EntityFrameworkCore;
using MimeKit;

namespace BusSolutionApi.Services;

// The actual SMTP hop. Throws on failure so callers (the outbox worker) can retry.
public class EmailDelivery(EmailSettings settings, AppDbContext db)
{
    public async Task<EmailSettings> ResolveSettingsAsync()
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

    public async Task<bool> IsConfiguredAsync() => !string.IsNullOrWhiteSpace((await ResolveSettingsAsync()).Host);

    public async Task DeliverAsync(MimeMessage message, CancellationToken ct = default)
    {
        var s = await ResolveSettingsAsync();
        if (string.IsNullOrWhiteSpace(s.Host))
            throw new EmailNotConfiguredException();

        if (message.From.Count == 0 || message.From.Mailboxes.All(m => string.IsNullOrWhiteSpace(m.Address)))
        {
            message.From.Clear();
            message.From.Add(new MailboxAddress(s.FromName, s.FromAddress));
        }

        using var client = new MailKit.Net.Smtp.SmtpClient();
        await client.ConnectAsync(s.Host, s.Port, MailKit.Security.SecureSocketOptions.StartTls, ct);
        await client.AuthenticateAsync(s.Username, s.Password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}

public class EmailNotConfiguredException() : Exception("SMTP er ikke konfigurert.");
