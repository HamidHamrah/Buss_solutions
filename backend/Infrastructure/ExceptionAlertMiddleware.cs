using BusSolutionApi.Services;

namespace BusSolutionApi.Infrastructure;

// Logs unhandled exceptions, alerts, and returns a clean 500 without leaking details.
public class ExceptionAlertMiddleware(RequestDelegate next, ILogger<ExceptionAlertMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, AlertService alerts)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex) when (!context.RequestAborted.IsCancellationRequested)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            await alerts.RaiseAsync($"5xx:{context.Request.Path}", $"Uventet feil på {context.Request.Method} {context.Request.Path}: {ex.GetType().Name}");
            if (context.Response.HasStarted) throw;
            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { message = "Noe gikk galt. Prøv igjen senere." });
        }
    }
}
