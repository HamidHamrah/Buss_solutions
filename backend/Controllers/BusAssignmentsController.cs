using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BusSolutionApi.Application.Planning;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[Authorize(Policy = "AdminOnly")]
[ApiController]
[Route("api/assignments")]
public class BusAssignmentsController(TripPlanningService planning) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? year, [FromQuery] int? month,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] TripStatus? status,
        [FromQuery] int? bookingId, [FromQuery] string? search) =>
        Ok(await planning.GetAllAsync(year, month, from, to, status, bookingId, search));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var assignment = await planning.GetByIdAsync(id);
        return assignment == null ? NotFound() : Ok(assignment);
    }

    [HttpGet("{id}/position-history")]
    public async Task<IActionResult> GetPositionHistory(int id)
    {
        var pings = await planning.GetPositionHistoryAsync(id);
        return pings == null ? NotFound() : Ok(pings);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssignmentRequest req)
    {
        var (result, error, statusCode) = await planning.CreateAsync(req);
        if (result != null) return Ok(result);
        return statusCode == 409 ? Conflict(new { error }) : BadRequest(new { error });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssignmentRequest req)
    {
        var (result, error, statusCode) = await planning.UpdateAsync(id, req);
        if (result != null) return Ok(result);
        if (statusCode == 404) return NotFound();
        return statusCode == 409 ? Conflict(new { error }) : BadRequest(new { error });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) =>
        await planning.DeleteAsync(id) ? NoContent() : NotFound();

    [HttpPut("{id}/stops")]
    public async Task<IActionResult> ReplaceStops(int id, [FromBody] List<StopRequest> stops)
    {
        var result = await planning.ReplaceStopsAsync(id, stops);
        return result == null ? NotFound() : Ok(result);
    }
}

