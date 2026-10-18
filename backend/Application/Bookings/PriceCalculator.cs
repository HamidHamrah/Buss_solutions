using BusSolutionApi.Models;

namespace BusSolutionApi.Application.Bookings;

public record PriceInput(
    decimal Km, string? DepartureTime, string TripType, bool BusOnStay, decimal StayDurationHours,
    decimal KmRate, decimal HourRate, int BusCount);

public record PriceResult(decimal Base, decimal Vat, decimal Total);

// Server-side port of the frontend's calcTripPrice (frontend/src/services/config.js). The browser
// still shows a live estimate, but this is the number that is stored on the booking. Keep the two
// in sync — frontend/src/services/config.js documents the same rules.
public static class PriceCalculator
{
    public static PriceResult Calculate(SiteConfig cfg, PriceInput input)
    {
        var hour = 12;
        if (!string.IsNullOrWhiteSpace(input.DepartureTime) && int.TryParse(input.DepartureTime.Split(':')[0], out var h))
            hour = h;
        var isNight = hour >= 21 || hour < 6;
        var surcharge = isNight ? cfg.NightSurcharge / 100m : 0m;
        var effectiveHourRate = input.HourRate * (1 + surcharge);

        var travelHours = input.Km / 80m;
        var legs = input.TripType == "return" ? 2 : 1;

        var basePrice = (input.Km * legs * input.KmRate) + (travelHours * legs * effectiveHourRate);

        if (input.BusOnStay && input.StayDurationHours > 0)
            basePrice += input.StayDurationHours * effectiveHourRate;

        foreach (var v in cfg.CustomVariables.Where(v => !v.Optional))
        {
            switch (v.Type)
            {
                case "flat": basePrice += v.Value; break;
                case "per_km": basePrice += v.Value * input.Km * legs; break;
                case "per_hour": basePrice += v.Value * travelHours * legs; break;
                case "percent": basePrice *= 1 + v.Value / 100m; break;
            }
        }

        basePrice = Math.Max(basePrice, cfg.MinInvoice);
        var vat = basePrice * (cfg.VatPercent / 100m);

        // Rounded per bus first (as the browser does), then multiplied by the number of buses.
        var perBusBase = Round(basePrice);
        var perBusVat = Round(vat);
        var perBusTotal = Round(basePrice + vat);
        var buses = Math.Max(1, input.BusCount);
        return new PriceResult(perBusBase * buses, perBusVat * buses, perBusTotal * buses);
    }

    private static decimal Round(decimal v) => Math.Round(v, 0, MidpointRounding.AwayFromZero);
}
