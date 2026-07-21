using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/job-applications")]
public class JobApplicationsController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] JobApplicationRequest req)
    {
        var app = new JobApplication
        {
            Name = req.Name,
            Email = req.Email,
            Phone = req.Phone,
            Age = req.Age,
            Location = req.Location,
            Education = req.Education,
            CurrentJob = req.CurrentJob,
            Notes = req.Notes,
            CvUrl = req.CvUrl,
            LicenseFrontUrl = req.LicenseFrontUrl,
            LicenseBackUrl = req.LicenseBackUrl,
            YskUrl = req.YskUrl,
        };
        db.JobApplications.Add(app);
        await db.SaveChangesAsync();
        return Ok(new { message = "Søknaden er mottatt. Vi tar kontakt snart!" });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var total = await db.JobApplications.CountAsync();
        var items = await db.JobApplications
            .OrderByDescending(a => a.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusRequest req)
    {
        var app = await db.JobApplications.FindAsync(id);
        if (app == null) return NotFound();
        app.Status = req.Status;
        await db.SaveChangesAsync();
        return Ok(app);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var app = await db.JobApplications.FindAsync(id);
        if (app == null) return NotFound();
        db.JobApplications.Remove(app);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record JobApplicationRequest(
    string Name, string Email, string Phone,
    string Age, string Location, string Education, string CurrentJob, string Notes,
    string CvUrl, string LicenseFrontUrl, string LicenseBackUrl, string YskUrl
);
public record StatusRequest(string Status);
