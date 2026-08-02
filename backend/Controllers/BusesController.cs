using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/buses")]
public class BusesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var query = db.Buses.Include(b => b.PriceCategory).AsQueryable();
        if (activeOnly) query = query.Where(b => b.Active && b.ShowOnWebsite);
        var buses = await query.OrderBy(b => b.SortOrder).ToListAsync();
        return Ok(buses);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BusRequest req)
    {
        var maxOrder = db.Buses.Any() ? await db.Buses.MaxAsync(b => b.SortOrder) : 0;
        var bus = new Bus
        {
            ExternalId = Guid.NewGuid().ToString(),
            Name = req.Name,
            RegistrationNumber = req.RegistrationNumber,
            Seats = req.Seats,
            Description = req.Description,
            Images = req.Images,
            Amenities = req.Amenities,
            Active = req.Active,
            ShowOnWebsite = req.ShowOnWebsite,
            SortOrder = maxOrder + 1,
            PriceCategoryId = req.PriceCategoryId
        };
        db.Buses.Add(bus);
        await db.SaveChangesAsync();
        await db.Entry(bus).Reference(b => b.PriceCategory).LoadAsync();
        return Ok(bus);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] BusRequest req)
    {
        var bus = await db.Buses.Include(b => b.PriceCategory).FirstOrDefaultAsync(b => b.Id == id);
        if (bus == null) return NotFound();

        bus.Name = req.Name;
        bus.RegistrationNumber = req.RegistrationNumber;
        bus.Seats = req.Seats;
        bus.Description = req.Description;
        bus.Images = req.Images;
        bus.Amenities = req.Amenities;
        bus.Active = req.Active;
        bus.ShowOnWebsite = req.ShowOnWebsite;
        bus.PriceCategoryId = req.PriceCategoryId;

        await db.SaveChangesAsync();
        await db.Entry(bus).Reference(b => b.PriceCategory).LoadAsync();
        return Ok(bus);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var bus = await db.Buses.FindAsync(id);
        if (bus == null) return NotFound();
        db.Buses.Remove(bus);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record BusRequest(string Name, int Seats, string Description, List<string> Images, List<string> Amenities, bool Active, bool ShowOnWebsite = false, int? PriceCategoryId = null, string RegistrationNumber = "");
