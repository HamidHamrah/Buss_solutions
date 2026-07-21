using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadController(AppDbContext dbContext) : ControllerBase
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf", ".doc", ".docx"];

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        return await SaveAsync(file, cancellationToken);
    }

    // Public endpoint for job application file uploads (CV, license, YSK)
    [HttpPost("public")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadPublic(IFormFile file, CancellationToken cancellationToken)
    {
        return await SaveAsync(file, cancellationToken);
    }

    [HttpGet("{id:guid}")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> GetFile(Guid id, CancellationToken cancellationToken)
    {
        var asset = await dbContext.UploadedAssets
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (asset is null)
        {
            return NotFound();
        }

        return File(asset.Data, asset.ContentType, asset.FileName);
    }

    private async Task<IActionResult> SaveAsync(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Ingen fil mottatt.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest("Filtypen er ikke tillatt.");

        using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken);

        var asset = new UploadedAsset
        {
            Id = Guid.NewGuid(),
            FileName = $"{Guid.NewGuid()}{ext}",
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            Data = memory.ToArray(),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.UploadedAssets.Add(asset);
        await dbContext.SaveChangesAsync(cancellationToken);

        var url = $"{Request.Scheme}://{Request.Host}/api/upload/{asset.Id}";
        return Ok(new { url });
    }
}
