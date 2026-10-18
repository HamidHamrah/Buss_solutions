namespace BusSolutionApi.Models;

public enum EmailStatus { Pending = 0, Sent = 1, Failed = 2 }

// Every outgoing email is stored here first and delivered by EmailOutboxWorker, so a SMTP outage
// delays an email instead of losing it, and failures stay visible and retryable.
public class EmailOutbox
{
    public int Id { get; set; }
    public string ToAddress { get; set; } = "";
    public string Subject { get; set; } = "";
    public string RawMessage { get; set; } = "";
    public EmailStatus Status { get; set; } = EmailStatus.Pending;
    public int Attempts { get; set; }
    public string? LastError { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt { get; set; }
}
