using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/service-categories")]
public class ServiceCategoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var q = db.ServiceCategories.AsQueryable();
        if (activeOnly) q = q.Where(s => s.Active);
        return Ok(await q.OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToListAsync());
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var s = await db.ServiceCategories.FirstOrDefaultAsync(x => x.Slug == slug);
        if (s == null) return NotFound();
        return Ok(s);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ServiceCategoryRequest req)
    {
        var s = Map(new ServiceCategory(), req);
        db.ServiceCategories.Add(s);
        await db.SaveChangesAsync();
        return Ok(s);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ServiceCategoryRequest req)
    {
        var s = await db.ServiceCategories.FindAsync(id);
        if (s == null) return NotFound();
        Map(s, req);
        await db.SaveChangesAsync();
        return Ok(s);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await db.ServiceCategories.FindAsync(id);
        if (s == null) return NotFound();
        db.ServiceCategories.Remove(s);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ServiceCategory Map(ServiceCategory s, ServiceCategoryRequest req)
    {
        s.Slug        = req.Slug;
        s.Title       = req.Title;
        s.Intro       = req.Intro;
        s.HeroImage   = req.HeroImage;
        s.DetailImage = req.DetailImage;
        s.Headline    = req.Headline;
        s.Body        = req.Body;
        s.Highlights  = req.Highlights;
        s.Group       = req.Group;
        s.SortOrder   = req.SortOrder;
        s.Active      = req.Active;
        return s;
    }
}

public record ServiceCategoryRequest(
    string Slug, string Title, string Intro,
    string HeroImage, string DetailImage,
    string Headline, List<string> Body, List<string> Highlights,
    string Group, int SortOrder, bool Active
);
