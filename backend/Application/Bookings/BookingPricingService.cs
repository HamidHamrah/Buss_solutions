using BusSolutionApi.Models;

namespace BusSolutionApi.Application.Bookings;

public class BookingPricingService
{
    public void ApplyClientEstimate(Booking booking, CreateBookingRequest req)
    {
        booking.EstimatedBase = req.EstimatedBase;
        booking.EstimatedVat = req.EstimatedVat;
        booking.EstimatedTotal = req.EstimatedTotal;
        booking.PriceAdjustment = req.PriceAdjustment ?? 0;
        booking.PriceAdjustmentNote = req.PriceAdjustmentNote;
        booking.DistanceKm = req.DistanceKm;
    }

    public void RecomputeTotal(Booking booking) =>
        booking.EstimatedTotal = booking.EstimatedBase
            + booking.EstimatedVat
            + booking.PriceAdjustment
            + booking.ExtraCharges.Sum(c => c.Amount);
}

