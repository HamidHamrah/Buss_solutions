using BusSolutionApi.Models;

namespace BusSolutionApi.Services;

public class DriverCredentialService(ISmsService smsService)
{
    private const string PasswordAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; // no 0/O/1/l/I

    // Generates a random password, hashes it onto the driver, and texts the plaintext
    // password to the driver's phone — the same phone number they log in with. The
    // plaintext password is never persisted or returned to the caller.
    public async Task IssueCredentialsAsync(Driver driver, CancellationToken cancellationToken = default)
    {
        var password = GeneratePassword();
        driver.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        driver.MustChangePassword = true;

        var message = $"Hei {driver.FirstName}! Din Kjosavik Reiser-konto er klar.\n" +
            $"Logg inn med telefonnummeret ditt ({driver.Phone}) og passordet: {password}\n" +
            "Du må bytte passord ved første innlogging.";

        await smsService.SendAsync(driver.Phone, message);
    }

    private static string GeneratePassword()
    {
        var random = Random.Shared;
        return new string(Enumerable.Range(0, 10)
            .Select(_ => PasswordAlphabet[random.Next(PasswordAlphabet.Length)])
            .ToArray());
    }
}
