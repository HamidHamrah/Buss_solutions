using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/partners")]
public class PartnersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var query = db.Partners.AsQueryable();
        if (activeOnly) query = query.Where(p => p.Active);
        return Ok(await query.OrderBy(p => p.SortOrder).ToListAsync());
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PartnerRequest req)
    {
        var maxOrder = db.Partners.Any() ? await db.Partners.MaxAsync(p => p.SortOrder) : 0;
        var partner = new Partner
        {
            Name = req.Name,
            LogoUrl = req.LogoUrl,
            WebsiteUrl = req.WebsiteUrl,
            Active = req.Active,
            SortOrder = maxOrder + 1
        };
        db.Partners.Add(partner);
        await db.SaveChangesAsync();
        return Ok(partner);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PartnerRequest req)
    {
        var partner = await db.Partners.FindAsync(id);
        if (partner == null) return NotFound();
        partner.Name = req.Name;
        partner.LogoUrl = req.LogoUrl;
        partner.WebsiteUrl = req.WebsiteUrl;
        partner.Active = req.Active;
        await db.SaveChangesAsync();
        return Ok(partner);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var partner = await db.Partners.FindAsync(id);
        if (partner == null) return NotFound();
        db.Partners.Remove(partner);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record PartnerRequest(string Name, string LogoUrl, string WebsiteUrl, bool Active = true);
