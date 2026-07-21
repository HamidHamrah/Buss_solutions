using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/price-categories")]
public class PriceCategoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cats = await db.PriceCategories.OrderBy(c => c.SortOrder).ToListAsync();
        return Ok(cats);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PriceCategoryRequest req)
    {
        var maxOrder = db.PriceCategories.Any() ? await db.PriceCategories.MaxAsync(c => c.SortOrder) : 0;
        var cat = new PriceCategory
        {
            Name = req.Name,
            KmRate = req.KmRate,
            HourRate = req.HourRate,
            SortOrder = maxOrder + 1
        };
        db.PriceCategories.Add(cat);
        await db.SaveChangesAsync();
        return Ok(cat);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PriceCategoryRequest req)
    {
        var cat = await db.PriceCategories.FindAsync(id);
        if (cat == null) return NotFound();
        cat.Name = req.Name;
        cat.KmRate = req.KmRate;
        cat.HourRate = req.HourRate;
        await db.SaveChangesAsync();
        return Ok(cat);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cat = await db.PriceCategories.FindAsync(id);
        if (cat == null) return NotFound();
        // Unlink buses before deleting
        await db.Buses.Where(b => b.PriceCategoryId == id)
            .ExecuteUpdateAsync(s => s.SetProperty(b => b.PriceCategoryId, (int?)null));
        db.PriceCategories.Remove(cat);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record PriceCategoryRequest(string Name, decimal KmRate, decimal HourRate);
