using BusSolutionApi.Models;

namespace BusSolutionApi.Application.Bookings;

public record CreateBookingRequest(
    string FromAddress, string ToAddress, List<string> Stops,
    DateTime DepartureDate, string DepartureTime, string TripType,
    bool BusOnStay, int? StayDurationHours,
    DateTime? ReturnDate, string? ReturnTime,
    string? BusId, string BusName, int Passengers, int BusCount,
    bool NeedsTrailer, bool NeedsWheelchair, List<string> SelectedExtras,
    decimal EstimatedBase, decimal EstimatedVat, decimal EstimatedTotal, int DistanceKm,
    string CustomerType, string ContactName, string ContactEmail, string ContactPhone,
    string? OrgName, string? OrgNumber, string? Message,
    decimal? PriceAdjustment = null, string? PriceAdjustmentNote = null
);

public record UpdateStatusRequest(BookingStatus Status);
public record UpdateNotesRequest(string? Notes);
public record UpdatePriceRequest(decimal PriceAdjustment, string? PriceAdjustmentNote);
public record UpdatePaymentStatusRequest(PaymentStatus PaymentStatus);
public record ExtraChargeRequest(string Description, decimal Amount);

