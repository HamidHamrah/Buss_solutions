using BusSolutionApi.Data;
using BusSolutionApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BusSolutionApi.Services;

public class DriverCredentialService(ISmsService smsService, EmailService emailService, AppDbContext db)
{
    private const string PasswordAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; // no 0/O/1/l/I

    // Generates a random password, hashes it onto the driver, then delivers it by
    // both SMS (if Twilio is configured) and email (always, as the reliable fallback).
    public async Task IssueCredentialsAsync(Driver driver, CancellationToken cancellationToken = default)
    {
        var password = GeneratePassword();
        driver.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        driver.MustChangePassword = true;

        var cfg = await db.SiteConfigs.OrderBy(c => c.Id).FirstOrDefaultAsync(cancellationToken);
        var companyName = cfg?.CompanyName ?? "oss";

        // SMS — fire-and-forget, may silently no-op if Twilio is not configured
        var smsMessage = $"Hei {driver.FirstName}! Din {companyName}-konto er klar.\n" +
            $"Logg inn med telefonnummeret ditt ({driver.Phone}) og passordet: {password}\n" +
            "Du må bytte passord ved første innlogging.";
        _ = smsService.SendAsync(driver.Phone, smsMessage);

        // Email — always sent if the driver has an email address
        if (!string.IsNullOrWhiteSpace(driver.Email))
        {
            await emailService.SendDriverCredentialsAsync(driver.Email, driver.FirstName, driver.Phone, password);
        }
    }

    private static string GeneratePassword()
    {
        var random = Random.Shared;
        return new string(Enumerable.Range(0, 10)
            .Select(_ => PasswordAlphabet[random.Next(PasswordAlphabet.Length)])
            .ToArray());
    }
}
