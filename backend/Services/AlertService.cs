using System.Collections.Concurrent;
using System.Net.Http.Json;

namespace BusSolutionApi.Services;

// Pushes operational alerts to a chat webhook (Slack, Discord, Teams "text" payload).
// Configure Alerts__WebhookUrl; without it alerts are only logged. Each key is throttled so one
// recurring problem cannot flood the channel.
public class AlertService(IConfiguration config, IHttpClientFactory httpFactory, ILogger<AlertService> logger)
{
    private static readonly ConcurrentDictionary<string, DateTime> LastSent = new();
    private static readonly TimeSpan Throttle = TimeSpan.FromMinutes(15);

    public async Task RaiseAsync(string key, string message)
    {
        logger.LogError("ALERT [{Key}] {Message}", key, message);

        var now = DateTime.UtcNow;
        if (LastSent.TryGetValue(key, out var last) && now - last < Throttle) return;
        LastSent[key] = now;

        var url = config["Alerts:WebhookUrl"];
        if (string.IsNullOrWhiteSpace(url)) return;

        try
        {
            var customer = config["Customer:Slug"] ?? "app";
            using var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);
            var text = $"[{customer}] {message}";
            await client.PostAsJsonAsync(url, new { text, content = text });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not deliver alert webhook");
        }
    }
}
