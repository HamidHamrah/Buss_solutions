namespace BusSolutionApi.Application.Bookings;

public class BookingReferenceGenerator
{
    public string Generate() => $"NTR-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
}

