using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;
using Microsoft.AspNetCore.RateLimiting;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadController(AppDbContext dbContext) : ControllerBase
{
    private static readonly string[] AdminExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf", ".doc", ".docx"];
    private static readonly string[] PublicExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"];

    private static readonly Dictionary<string, string> ContentTypes = new()
    {
        [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg", [".png"] = "image/png", [".gif"] = "image/gif",
        [".webp"] = "image/webp", [".svg"] = "image/svg+xml", [".pdf"] = "application/pdf",
        [".doc"] = "application/msword",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    // The file must actually start with the bytes its extension claims.
    private static bool MatchesSignature(string ext, byte[] d)
    {
        bool Starts(params byte[] sig) => d.Length >= sig.Length && d.AsSpan(0, sig.Length).SequenceEqual(sig);
        return ext switch
        {
            ".jpg" or ".jpeg" => Starts(0xFF, 0xD8, 0xFF),
            ".png" => Starts(0x89, 0x50, 0x4E, 0x47),
            ".gif" => Starts(0x47, 0x49, 0x46, 0x38),
            ".webp" => Starts(0x52, 0x49, 0x46, 0x46) && d.Length > 12 && d[8] == 0x57 && d[9] == 0x45 && d[10] == 0x42 && d[11] == 0x50,
            ".pdf" => Starts(0x25, 0x50, 0x44, 0x46),
            ".docx" => Starts(0x50, 0x4B, 0x03, 0x04),
            ".doc" => Starts(0xD0, 0xCF, 0x11, 0xE0),
            ".svg" => System.Text.Encoding.UTF8.GetString(d, 0, Math.Min(d.Length, 512)).Contains("<svg", StringComparison.OrdinalIgnoreCase)
                      || System.Text.Encoding.UTF8.GetString(d, 0, Math.Min(d.Length, 512)).Contains("<?xml", StringComparison.OrdinalIgnoreCase),
            _ => false,
        };
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        return await SaveAsync(file, AdminExtensions, cancellationToken);
    }

    // Public endpoint for job application file uploads (CV, license, YSK)
    [HttpPost("public")]
    [EnableRateLimiting("upload")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadPublic(IFormFile file, CancellationToken cancellationToken)
    {
        return await SaveAsync(file, PublicExtensions, cancellationToken);
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

        Response.Headers["X-Content-Type-Options"] = "nosniff";
        // Uploads can come from the public; never let them run script in our origin.
        Response.Headers["Content-Security-Policy"] = "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'";
        return File(asset.Data, asset.ContentType, asset.FileName);
    }

    private async Task<IActionResult> SaveAsync(IFormFile file, string[] allowed, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Ingen fil mottatt.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest("Filtypen er ikke tillatt.");

        using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken);

        var bytes = memory.ToArray();
        if (!MatchesSignature(ext, bytes))
            return BadRequest("Filinnholdet stemmer ikke med filtypen.");

        var asset = new UploadedAsset
        {
            Id = Guid.NewGuid(),
            FileName = $"{Guid.NewGuid()}{ext}",
            ContentType = ContentTypes[ext],
            Data = bytes,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.UploadedAssets.Add(asset);
        await dbContext.SaveChangesAsync(cancellationToken);

        var url = $"{Request.Scheme}://{Request.Host}/api/upload/{asset.Id}";
        return Ok(new { url });
    }
}
