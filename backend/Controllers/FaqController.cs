using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/faqs")]
public class FaqController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var q = db.FaqItems.AsQueryable();
        if (activeOnly) q = q.Where(f => f.Active);
        return Ok(await q.OrderBy(f => f.SortOrder).ThenBy(f => f.Id).ToListAsync());
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FaqRequest req)
    {
        var item = new FaqItem { Question = req.Question, Answer = req.Answer, SortOrder = req.SortOrder, Active = req.Active };
        db.FaqItems.Add(item);
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] FaqRequest req)
    {
        var item = await db.FaqItems.FindAsync(id);
        if (item == null) return NotFound();
        item.Question = req.Question;
        item.Answer = req.Answer;
        item.SortOrder = req.SortOrder;
        item.Active = req.Active;
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await db.FaqItems.FindAsync(id);
        if (item == null) return NotFound();
        db.FaqItems.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record FaqRequest(string Question, string Answer, int SortOrder, bool Active);
