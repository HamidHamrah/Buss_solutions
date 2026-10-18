using BusSolutionApi.Models;

namespace BusSolutionApi.Application.Bookings;

public class BookingPricingService
{
    public const int MaxDistanceKm = 10_000;

    // Public bookings: the price is recalculated here from the configured rates and the chosen
    // bus category. Totals sent by the browser are ignored (and logged when they differ).
    public (string? Error, PriceResult? Client) ApplyServerEstimate(
        Booking booking, CreateBookingRequest req, SiteConfig cfg, PriceCategory? category)
    {
        if (category == null)
            return ("Ugyldig busstype. Last siden på nytt og velg busstype igjen.", null);
        if (req.DistanceKm <= 0 || req.DistanceKm > MaxDistanceKm)
            return ("Ugyldig avstand for ruten.", null);

        var result = PriceCalculator.Calculate(cfg, new PriceInput(
            // DistanceKm is the round-trip total; the calculator doubles one-way km itself
            req.TripType == "return" ? Math.Round(req.DistanceKm / 2m, 0, MidpointRounding.AwayFromZero) : req.DistanceKm,
            req.DepartureTime, req.TripType, req.BusOnStay, 0, // the booking form's estimate does not include stay hours; admin adjusts later
            category.KmRate, category.HourRate, req.BusCount));

        booking.EstimatedBase = result.Base;
        booking.EstimatedVat = result.Vat;
        booking.EstimatedTotal = result.Total;
        booking.PriceAdjustment = 0;
        booking.PriceAdjustmentNote = null;
        booking.DistanceKm = req.DistanceKm;
        return (null, new PriceResult(req.EstimatedBase, req.EstimatedVat, req.EstimatedTotal));
    }

    // Admin-created bookings carry a hand-set price and adjustment, so the admin's numbers are kept.
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
