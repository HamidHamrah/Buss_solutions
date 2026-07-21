using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;
using BusSolutionApi.Services;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController(AppDbContext db, EmailService email) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactRequest req)
    {
        var msg = new ContactMessage
        {
            Name = req.Name, Email = req.Email, Phone = req.Phone ?? "",
            Subject = req.Subject, Message = req.Message,
        };
        db.ContactMessages.Add(msg);
        await db.SaveChangesAsync();
        _ = email.SendContactNotificationAsync(msg.Name, msg.Email, msg.Phone, msg.Subject, msg.Message);
        _ = email.SendContactConfirmationAsync(msg.Email, msg.Name, msg.Subject);
        return Ok(new { id = msg.Id });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        var total = await db.ContactMessages.CountAsync();
        var items = await db.ContactMessages
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(new { total, items });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var msg = await db.ContactMessages.FindAsync(id);
        if (msg == null) return NotFound();
        if (msg.Status == ContactStatus.New) { msg.Status = ContactStatus.Read; await db.SaveChangesAsync(); }
        return Ok(msg);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/reply")]
    public async Task<IActionResult> Reply(int id, [FromBody] ReplyRequest req)
    {
        var msg = await db.ContactMessages.FindAsync(id);
        if (msg == null) return NotFound();
        msg.AdminReply = req.ReplyText;
        msg.Status = ContactStatus.Replied;
        msg.RepliedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        _ = email.SendContactReplyAsync(msg.Email, msg.Name, msg.Subject, req.ReplyText);
        return Ok(msg);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var msg = await db.ContactMessages.FindAsync(id);
        if (msg == null) return NotFound();
        db.ContactMessages.Remove(msg);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record ContactRequest(string Name, string Email, string? Phone, string Subject, string Message);
public record ReplyRequest(string ReplyText);
