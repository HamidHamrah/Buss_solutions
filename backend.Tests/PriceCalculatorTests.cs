using BusSolutionApi.Application.Bookings;
using BusSolutionApi.Models;

namespace BusSolutionApi.Tests;

public class PriceCalculatorTests
{
    private static SiteConfig Config(decimal min = 0, decimal vat = 25, decimal night = 30) =>
        new() { MinInvoice = min, VatPercent = vat, NightSurcharge = night, CustomVariables = [] };

    private static PriceInput Input(decimal km = 80, string time = "12:00", string type = "oneway", int buses = 1, bool stay = false, decimal stayHours = 0) =>
        new(km, time, type, stay, stayHours, KmRate: 20, HourRate: 1000, buses);

    [Fact]
    public void OneWayDaytimeTrip_IsKmPlusTravelHours()
    {
        // 80 km * 20 = 1600, plus 1 travel hour * 1000 = 2600, VAT 25% = 650
        var r = PriceCalculator.Calculate(Config(), Input());
        Assert.Equal(2600, r.Base);
        Assert.Equal(650, r.Vat);
        Assert.Equal(3250, r.Total);
    }

    [Fact]
    public void NightDeparture_AppliesSurchargeToHourRateOnly()
    {
        var r = PriceCalculator.Calculate(Config(night: 50), Input(time: "22:30"));
        Assert.Equal(1600 + 1500, r.Base);
    }

    [Fact]
    public void ReturnTrip_DoublesLegs()
    {
        var r = PriceCalculator.Calculate(Config(), Input(type: "return"));
        Assert.Equal(5200, r.Base);
    }

    [Fact]
    public void MinimumInvoice_IsApplied()
    {
        var r = PriceCalculator.Calculate(Config(min: 5000), Input(km: 10));
        Assert.Equal(5000, r.Base);
        Assert.Equal(6250, r.Total);
    }

    [Fact]
    public void BusCount_MultipliesRoundedPerBusPrice()
    {
        var r = PriceCalculator.Calculate(Config(), Input(buses: 3));
        Assert.Equal(7800, r.Base);
        Assert.Equal(9750, r.Total);
    }

    [Fact]
    public void StayHours_AreChargedWhenBusStays()
    {
        var r = PriceCalculator.Calculate(Config(), Input(stay: true, stayHours: 2));
        Assert.Equal(2600 + 2000, r.Base);
    }

    [Fact]
    public void CustomVariables_AreApplied_OptionalOnesSkipped()
    {
        var cfg = Config();
        cfg.CustomVariables =
        [
            new() { Type = "flat", Value = 400 },
            new() { Type = "per_km", Value = 1 },
            new() { Type = "flat", Value = 99999, Optional = true },
            new() { Type = "percent", Value = 10 },
        ];
        // (2600 + 400 + 80) * 1.10 = 3388
        Assert.Equal(3388, PriceCalculator.Calculate(cfg, Input()).Base);
    }

    [Fact]
    public void MissingDepartureTime_IsTreatedAsDaytime()
    {
        var r = PriceCalculator.Calculate(Config(), Input(time: ""));
        Assert.Equal(2600, r.Base);
    }
}
