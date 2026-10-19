using Microsoft.Extensions.Configuration;
using BusSolutionApi.Models;

namespace BusSolutionApi.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config)
    {
        if (db.SiteConfigs.Any()) return;

        var customer = CustomerConfigLoader.Load(config);
        var identity = customer.Identity;
        var content = customer.Content;

        // Initial admin login: configurable via Admin:InitialPhone / Admin:InitialPassword
        // (env: Admin__InitialPhone / Admin__InitialPassword), falling back to the customer
        // config's own defaults. Log in at /logg-inn, then change the password and add real
        // staff via Admin → Sjåfører.
        var initialPhone = config["Admin:InitialPhone"] ?? customer.AdminSeed.InitialPhone;
        var initialPassword = config["Admin:InitialPassword"] ?? customer.AdminSeed.InitialPassword;
        Console.WriteLine("=================================================");
        Console.WriteLine($"  INITIAL ADMIN LOGIN: {initialPhone} / {initialPassword}");
        Console.WriteLine("  Log in at /logg-inn, then change the password");
        Console.WriteLine("=================================================");

        db.SiteConfigs.Add(new SiteConfig
        {
            AdminPasswordHash = BCrypt.Net.BCrypt.HashPassword(initialPassword),

            KmRate = customer.Pricing.KmRate,
            HourRate = customer.Pricing.HourRate,
            NightSurcharge = customer.Pricing.NightSurcharge,
            WeekendSurcharge = customer.Pricing.WeekendSurcharge,
            DeadMileageRate = customer.Pricing.DeadMileageRate,
            DeadMileageRadiusKm = customer.Pricing.DeadMileageRadiusKm,
            VatPercent = customer.Pricing.VatPercent,
            MinInvoice = customer.Pricing.MinInvoice,

            HeroImageUrl = content.HeroImageUrl,
            HeroTitle = content.HeroTitle,
            HeroSubtitle = content.HeroSubtitle,
            HeroCta = content.HeroCta,
            Badge1 = content.Badge1,
            Badge2 = content.Badge2,
            Badge3 = content.Badge3,
            Badge4 = content.Badge4,
            Phone = identity.Phone,
            Email = identity.Email,
            Address = identity.Address,
            OrgNr = identity.OrgNr,
            FooterAbout = content.FooterAbout,
            RecruitTitle = content.RecruitTitle,
            RecruitText = content.RecruitText,
            PriceDisclaimer = content.PriceDisclaimer,

            OmOssHeroImageUrl = content.OmOssHeroImageUrl,
            OmOssIntroQuote = content.OmOssIntroQuote,
            OmOssCol1Title = content.OmOssCol1Title,
            OmOssCol1Text = content.OmOssCol1Text,
            OmOssCol2Title = content.OmOssCol2Title,
            OmOssCol2Text = content.OmOssCol2Text,
            OmOssCol3Title = content.OmOssCol3Title,
            OmOssCol3Text = content.OmOssCol3Text,

            ServicesTitle = content.ServicesTitle,
            ServicesSubtitle = content.ServicesSubtitle,
            ServicesBullet1 = content.ServicesBullet1,
            ServicesBullet2 = content.ServicesBullet2,
            ServicesBullet3 = content.ServicesBullet3,
            ServicesBullet4 = content.ServicesBullet4,
            ServicesImage1 = content.ServicesImage1,
            ServicesImage2 = content.ServicesImage2,
            ServicesImage3 = content.ServicesImage3,

            Stat1Value = content.Stat1Value,
            Stat1Label = content.Stat1Label,
            Stat2Value = content.Stat2Value,
            Stat2Label = content.Stat2Label,
            Stat3Value = content.Stat3Value,
            Stat3Label = content.Stat3Label,
            Stat4Value = content.Stat4Value,
            Stat4Label = content.Stat4Label,

            RecruitmentEnabled = content.RecruitmentEnabled,
            RecruitmentTeaserTitle = content.RecruitmentTeaserTitle,
            RecruitmentTeaserText = content.RecruitmentTeaserText,
            RecruitmentTeaserImageUrl = content.RecruitmentTeaserImageUrl,
            RecruitmentPageTitle = content.RecruitmentPageTitle,
            RecruitmentDescription = content.RecruitmentDescription,
            RecruitmentPageImageUrl = content.RecruitmentPageImageUrl,

            SocialFacebook = customer.Social.Facebook,
            SocialInstagram = customer.Social.Instagram,
            SocialLinkedin = customer.Social.Linkedin,

            TermsContent = content.TermsContent,
            PrivacyContent = content.PrivacyContent,
            BankAccountNumber = content.BankAccountNumber,

            CompanyName = identity.CompanyName,
            BrandNamePrimary = identity.BrandNamePrimary,
            BrandNameSecondary = identity.BrandNameSecondary,
            SiteDomain = identity.Domain,
            LogoPath = "/" + customer.Assets.Logo,
            LogoIncludesText = customer.Assets.LogoIncludesText,
            FaviconPath = "/" + customer.Assets.Favicon,
            OgImagePath = "/" + customer.Assets.OgImage,
            FoundingYear = identity.FoundingYear,
            GeoLat = identity.GeoLat,
            GeoLng = identity.GeoLng,
            OpeningHoursDays = identity.OpeningHoursDays,
            OpeningHoursOpen = identity.OpeningHoursOpen,
            OpeningHoursClose = identity.OpeningHoursClose,
            OpeningHoursText = identity.OpeningHoursText,
            EmergencyAvailabilityText = identity.EmergencyAvailabilityText,
            FooterCertifications = identity.FooterCertifications,
        });

        db.Drivers.Add(new Driver
        {
            FirstName = customer.AdminSeed.AdminFirstName,
            LastName = customer.AdminSeed.AdminLastName,
            Phone = initialPhone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(initialPassword),
            MustChangePassword = true,
            IsAdmin = true,
            Active = true,
        });

        // Price categories — keyed by name so buses can look up their category below
        var categoriesByName = customer.PriceCategories.ToDictionary(
            c => c.Name,
            c => new PriceCategory { Name = c.Name, KmRate = c.KmRate, HourRate = c.HourRate, SortOrder = c.SortOrder });
        db.PriceCategories.AddRange(categoriesByName.Values);

        // Fleet — assign category via navigation property
        db.Buses.AddRange(customer.Fleet.Select(b => new Bus
        {
            ExternalId = b.ExternalId,
            Name = b.Name,
            Seats = b.Seats,
            RegistrationNumber = b.RegistrationNumber,
            Description = b.Description,
            Images = b.Images,
            Amenities = b.Amenities,
            Active = true,
            SortOrder = b.SortOrder,
            PriceCategory = categoriesByName[b.PriceCategory]
        }));

        await db.SaveChangesAsync();
    }
}
