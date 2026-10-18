using BusSolutionApi.Data;
using BusSolutionApi.Models;
using Microsoft.EntityFrameworkCore;
using MimeKit;

namespace BusSolutionApi.Services;

public class EmailOutboxWorker(IServiceProvider services, ILogger<EmailOutboxWorker> logger) : BackgroundService
{
    public const int MaxAttempts = 5;
    private static readonly TimeSpan[] Backoff =
        [TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(15), TimeSpan.FromHours(1)];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await ProcessBatchAsync(stoppingToken); }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Email outbox batch failed");
            }
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
    }

    public async Task ProcessBatchAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var delivery = scope.ServiceProvider.GetRequiredService<EmailDelivery>();
        var alerts = scope.ServiceProvider.GetRequiredService<AlertService>();

        var due = await db.EmailOutbox
            .Where(e => e.Status == EmailStatus.Pending && e.NextAttemptAt <= DateTime.UtcNow)
            .OrderBy(e => e.Id).Take(10).ToListAsync(ct);

        foreach (var mail in due)
        {
            mail.Attempts++;
            try
            {
                using var raw = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(mail.RawMessage));
                var message = await MimeMessage.LoadAsync(raw, ct);
                await delivery.DeliverAsync(message, ct);
                mail.Status = EmailStatus.Sent;
                mail.SentAt = DateTime.UtcNow;
                mail.LastError = null;
            }
            catch (EmailNotConfiguredException ex)
            {
                // Retrying won't help until an admin configures SMTP; keep it for a manual retry.
                mail.Status = EmailStatus.Failed;
                mail.LastError = ex.Message;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                mail.LastError = ex.Message.Length > 500 ? ex.Message[..500] : ex.Message;
                if (mail.Attempts >= MaxAttempts)
                {
                    mail.Status = EmailStatus.Failed;
                    await alerts.RaiseAsync("email-failed", $"E-post '{mail.Subject}' til {mail.ToAddress} feilet etter {mail.Attempts} forsøk: {mail.LastError}");
                }
                else
                {
                    mail.NextAttemptAt = DateTime.UtcNow + Backoff[Math.Min(mail.Attempts - 1, Backoff.Length - 1)];
                }
            }
            await db.SaveChangesAsync(ct);
        }
    }
}
