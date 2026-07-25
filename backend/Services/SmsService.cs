using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace BusSolutionApi.Services;

public class TwilioSettings
{
    public string AccountSid { get; set; } = "";
    public string AuthToken { get; set; } = "";
    public string FromNumber { get; set; } = "";
}

public interface ISmsService
{
    Task SendAsync(string toPhone, string message);
}

public class TwilioSmsService(TwilioSettings settings, ILogger<TwilioSmsService> logger) : ISmsService
{
    private bool _initialized;

    public async Task SendAsync(string toPhone, string message)
    {
        if (string.IsNullOrWhiteSpace(settings.AccountSid) || string.IsNullOrWhiteSpace(settings.AuthToken))
        {
            logger.LogWarning("Twilio not configured — SMS not sent to {Phone}: {Message}", toPhone, message);
            return;
        }

        var normalized = NormalizePhone(toPhone);
        if (normalized is null)
        {
            logger.LogWarning("Could not normalize phone number {Phone} — SMS not sent", toPhone);
            return;
        }

        if (!_initialized)
        {
            TwilioClient.Init(settings.AccountSid, settings.AuthToken);
            _initialized = true;
        }

        logger.LogInformation("Sending SMS to {Phone} from {From}", normalized, settings.FromNumber);
        try
        {
            var result = await MessageResource.CreateAsync(
                body: message,
                from: new PhoneNumber(settings.FromNumber),
                to: new PhoneNumber(normalized));
            logger.LogInformation("SMS sent to {Phone}, SID={Sid}, Status={Status}", normalized, result.Sid, result.Status);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send SMS to {Phone}", normalized);
        }
    }

    // Norwegian numbers are stored as local 8-digit strings (e.g. "45 15 22 22").
    // Twilio requires E.164. If a number already starts with "+", leave it alone.
    private static string? NormalizePhone(string phone)
    {
        var digits = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());
        if (digits.StartsWith('+')) return digits;
        if (digits.Length == 8) return "+47" + digits;
        return digits.Length > 0 ? "+" + digits : null;
    }
}
