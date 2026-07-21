using Microsoft.Extensions.Configuration;
using BusSolutionApi.Models;

namespace BusSolutionApi.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config)
    {
        if (db.SiteConfigs.Any()) return;

        // Initial admin login: configurable via Admin:InitialPhone / Admin:InitialPassword
        // (env: Admin__InitialPhone / Admin__InitialPassword), falling back to known
        // defaults for local/first-run setup. Log in at /logg-inn, then change the
        // password and add real staff via Admin → Sjåfører.
        var initialPhone = config["Admin:InitialPhone"] ?? "90000000";
        var initialPassword = config["Admin:InitialPassword"] ?? "Test123!";
        Console.WriteLine("=================================================");
        Console.WriteLine($"  INITIAL ADMIN LOGIN: {initialPhone} / {initialPassword}");
        Console.WriteLine("  Log in at /logg-inn, then change the password");
        Console.WriteLine("=================================================");

        db.SiteConfigs.Add(new SiteConfig
        {
            AdminPasswordHash = BCrypt.Net.BCrypt.HashPassword(initialPassword)
        });

        db.Drivers.Add(new Driver
        {
            FirstName = "Admin",
            LastName = "Kjosavik Reiser",
            Phone = initialPhone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(initialPassword),
            MustChangePassword = true,
            IsAdmin = true,
            Active = true,
        });

        // Price categories
        var minibuss = new PriceCategory { Name = "Minibuss", KmRate = 14, HourRate = 650, SortOrder = 1 };
        var storBuss = new PriceCategory { Name = "Stor buss", KmRate = 22, HourRate = 1100, SortOrder = 2 };
        db.PriceCategories.AddRange(minibuss, storBuss);

        // Buses — assign category via navigation property
        db.Buses.AddRange(
            new Bus
            {
                ExternalId = "sprinter",
                Name = "Mercedes Sprinter VIP",
                Seats = 19,
                Description = "Våre minibusser har 16–20 regulerbare seter med setebelter, klimaanlegg, mikrofon, DAB, DVD, AUX. Alle våre busser har miljømotor Euro 6.",
                Images = ["https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=600&q=80"],
                Amenities = ["Wifi", "Klimaanlegg", "Mikrofon", "DAB Radio", "220 Volt", "Bagasjerom"],
                Active = true,
                SortOrder = 1,
                PriceCategory = minibuss
            },
            new Bus
            {
                ExternalId = "man",
                Name = "MAN Lions Coach",
                Seats = 48,
                Description = "MAN Lions Coach er en komfortabel turbuss med plass til 48 passasjerer. Euro 6-motor, klimaanlegg og bagasjeplass under bussen.",
                Images = ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"],
                Amenities = ["Wifi", "Klimaanlegg", "220 Volt", "WC", "Bagasjerom"],
                Active = true,
                SortOrder = 2,
                PriceCategory = storBuss
            },
            new Bus
            {
                ExternalId = "setra",
                Name = "Setra 516 HD",
                Seats = 53,
                Description = "Setra 516 HD er en premium turbuss med Euro 6-motor og høy komfortstandard. Perfekt for lange turer med store grupper.",
                Images = ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80"],
                Amenities = ["Wifi", "Klimaanlegg", "Kjøkken", "220 Volt", "WC", "Bagasjerom"],
                Active = true,
                SortOrder = 3,
                PriceCategory = storBuss
            },
            new Bus
            {
                ExternalId = "volvo",
                Name = "Volvo 9700 Premium",
                Seats = 58,
                Description = "Volvo 9700 Premium er en moderne turbuss med toppkarakter på sikkerhet og komfort. Euro 6-standard og fullt utstyrt for lange reiser.",
                Images = ["https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80"],
                Amenities = ["Wifi", "Klimaanlegg", "220 Volt", "WC", "Bagasjerom"],
                Active = true,
                SortOrder = 4,
                PriceCategory = storBuss
            }
        );

        await db.SaveChangesAsync();
    }
}
