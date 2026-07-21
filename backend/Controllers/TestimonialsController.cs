using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/testimonials")]
public class TestimonialsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var q = db.Testimonials.AsQueryable();
        if (activeOnly) q = q.Where(t => t.Active);
        return Ok(await q.OrderBy(t => t.SortOrder).ThenBy(t => t.Id).ToListAsync());
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TestimonialRequest req)
    {
        var t = new Testimonial
        {
            Name = req.Name, AvatarColor = req.AvatarColor, AvatarImageUrl = req.AvatarImageUrl,
            Rating = req.Rating, Text = req.Text, Source = req.Source,
            SortOrder = req.SortOrder, Active = req.Active
        };
        db.Testimonials.Add(t);
        await db.SaveChangesAsync();
        return Ok(t);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TestimonialRequest req)
    {
        var t = await db.Testimonials.FindAsync(id);
        if (t == null) return NotFound();
        t.Name = req.Name; t.AvatarColor = req.AvatarColor; t.AvatarImageUrl = req.AvatarImageUrl;
        t.Rating = req.Rating; t.Text = req.Text; t.Source = req.Source;
        t.SortOrder = req.SortOrder; t.Active = req.Active;
        await db.SaveChangesAsync();
        return Ok(t);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await db.Testimonials.FindAsync(id);
        if (t == null) return NotFound();
        db.Testimonials.Remove(t);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record TestimonialRequest(
    string Name, string AvatarColor, string AvatarImageUrl,
    int Rating, string Text, string Source, int SortOrder, bool Active
);
