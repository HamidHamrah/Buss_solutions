using BusSolutionApi.Data;
using BusSolutionApi.Infrastructure;
using BusSolutionApi.Models;
using BusSolutionApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/system")]
public class SystemController(AppDbContext db, EmailDelivery email, AuditService audit) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> Status() => Ok(await SystemStatus.BuildAsync(db, email));

    [HttpGet("emails")]
    public async Task<IActionResult> Emails([FromQuery] string? status = null)
    {
        var q = db.EmailOutbox.AsNoTracking().AsQueryable();
        if (Enum.TryParse<EmailStatus>(status, true, out var st)) q = q.Where(e => e.Status == st);
        var rows = await q.OrderByDescending(e => e.Id).Take(100)
            .Select(e => new
            {
                e.Id, e.ToAddress, e.Subject, status = e.Status.ToString(), e.Attempts,
                e.LastError, e.CreatedAt, e.SentAt, e.NextAttemptAt,
            }).ToListAsync();
        return Ok(rows);
    }

    [HttpPost("emails/{id:int}/retry")]
    public async Task<IActionResult> Retry(int id)
    {
        var mail = await db.EmailOutbox.FindAsync(id);
        if (mail == null) return NotFound();
        if (mail.Status == EmailStatus.Sent) return BadRequest(new { message = "E-posten er allerede sendt." });
        mail.Status = EmailStatus.Pending;
        mail.Attempts = 0;
        mail.NextAttemptAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await audit.RecordAsync("retry", "EmailOutbox", id.ToString(), $"Prøver å sende e-post på nytt: {mail.Subject}", "Admin");
        return Ok();
    }

    [HttpGet("audit")]
    public async Task<IActionResult> Audit([FromQuery] string? entityType = null, [FromQuery] string? entityId = null, [FromQuery] int take = 100)
    {
        var q = db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(entityType)) q = q.Where(a => a.EntityType == entityType);
        if (!string.IsNullOrWhiteSpace(entityId)) q = q.Where(a => a.EntityId == entityId);
        return Ok(await q.OrderByDescending(a => a.Id).Take(Math.Clamp(take, 1, 500)).ToListAsync());
    }
}
