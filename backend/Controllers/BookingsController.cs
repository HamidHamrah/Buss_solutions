using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BusSolutionApi.Application.Bookings;
using BusSolutionApi.Application.Invoices;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController(BookingService bookings, BookingQueries queries, OperationsQueries operations, InvoiceService invoices) : ControllerBase
{
    [HttpPost]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("booking")]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req)
    {
        var (booking, error, statusCode) = await bookings.CreateAsync(req);
        if (error != null)
            return statusCode == 409 ? Conflict(new { error }) : BadRequest(new { error });

        return Ok(new { reference = booking!.Reference });
    }

    [HttpGet("lookup/{reference}")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("booking")]
    public async Task<IActionResult> Lookup(string reference)
    {
        var booking = await bookings.LookupAsync(reference);
        return booking == null ? NotFound(new { error = "Bestillingen ble ikke funnet." }) : Ok(booking);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await queries.GetAllAsync(page, pageSize));

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var booking = await queries.GetByIdAsync(id);
        return booking == null ? NotFound() : Ok(booking);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("unplanned")]
    public async Task<IActionResult> GetUnplanned() => Ok(await queries.GetUnplannedAsync());

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("inbox")]
    public async Task<IActionResult> GetInbox() => Ok(await operations.GetInboxAsync());

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? q) => Ok(await operations.SearchAsync(q));

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats() => Ok(await queries.GetStatsAsync());

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        var booking = await bookings.UpdateStatusAsync(id, req.Status);
        return booking == null ? NotFound() : Ok(booking);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/invoice")]
    public async Task<IActionResult> GenerateInvoice(int id)
    {
        var result = await invoices.GenerateInvoiceAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/invoice/send")]
    public async Task<IActionResult> SendInvoice(int id)
    {
        var (result, error, statusCode) = await invoices.SendInvoiceAsync(id);
        if (result != null) return Ok(result);
        if (statusCode == 404) return NotFound();
        return StatusCode(statusCode, new { error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] string? status = null) =>
        Ok(await queries.GetInvoicesAsync(status));

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/payment-status")]
    public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusRequest req)
    {
        var (result, error) = await invoices.UpdatePaymentStatusAsync(id, req.PaymentStatus);
        if (result != null) return Ok(result);
        return error == null ? NotFound() : BadRequest(new { error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/notes")]
    public async Task<IActionResult> UpdateNotes(int id, [FromBody] UpdateNotesRequest req)
    {
        var result = await bookings.UpdateNotesAsync(id, req.Notes);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}/price")]
    public async Task<IActionResult> UpdatePrice(int id, [FromBody] UpdatePriceRequest req)
    {
        var (result, error) = await bookings.UpdatePriceAsync(id, req);
        if (result != null) return Ok(result);
        return error == null ? NotFound() : BadRequest(new { error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/extra-charges")]
    public async Task<IActionResult> AddExtraCharge(int id, [FromBody] ExtraChargeRequest req)
    {
        var (result, error) = await bookings.AddExtraChargeAsync(id, req);
        if (result != null) return Ok(result);
        return error == null ? NotFound() : BadRequest(new { error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}/extra-charges/{index:int}")]
    public async Task<IActionResult> RemoveExtraCharge(int id, int index)
    {
        var (result, error) = await bookings.RemoveExtraChargeAsync(id, index);
        if (result != null) return Ok(result);
        return error == null ? NotFound() : BadRequest(new { error });
    }
}

