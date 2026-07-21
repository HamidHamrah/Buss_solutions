using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace BusSolutionApi.Data;

public static class CustomerConfigLoader
{
    public class CustomerConfig
    {
        public string Slug { get; set; } = "";
        public IdentitySection Identity { get; set; } = new();
        public SocialSection Social { get; set; } = new();
        public SeoSection Seo { get; set; } = new();
        public AssetsSection Assets { get; set; } = new();
        public AdminSeedSection AdminSeed { get; set; } = new();
        public PricingSection Pricing { get; set; } = new();
        public List<PriceCategorySeed> PriceCategories { get; set; } = [];
        public List<BusSeed> Fleet { get; set; } = [];
        public ContentSection Content { get; set; } = new();
        public DeploymentSection Deployment { get; set; } = new();
    }

    public class IdentitySection
    {
        public string CompanyName { get; set; } = "";
        public string BrandNamePrimary { get; set; } = "";
        public string BrandNameSecondary { get; set; } = "";
        public string Domain { get; set; } = "";
        public string OrgNr { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Email { get; set; } = "";
        public string Address { get; set; } = "";
        public string FoundingYear { get; set; } = "";
        public decimal GeoLat { get; set; }
        public decimal GeoLng { get; set; }
        public List<string> OpeningHoursDays { get; set; } = [];
        public string OpeningHoursOpen { get; set; } = "";
        public string OpeningHoursClose { get; set; } = "";
        public string OpeningHoursText { get; set; } = "";
        public string EmergencyAvailabilityText { get; set; } = "";
        public List<string> FooterCertifications { get; set; } = [];
    }

    public class SocialSection
    {
        public string Facebook { get; set; } = "";
        public string Instagram { get; set; } = "";
        public string Linkedin { get; set; } = "";
    }

    public class SeoSection
    {
        public string MetaTitle { get; set; } = "";
        public string MetaDescription { get; set; } = "";
        public string OgSiteName { get; set; } = "";
    }

    public class AssetsSection
    {
        public string Logo { get; set; } = "";
        public string Favicon { get; set; } = "";
        public string OgImage { get; set; } = "";
    }

    public class AdminSeedSection
    {
        public string InitialPhone { get; set; } = "90000000";
        public string InitialPassword { get; set; } = "Test123!";
        public string AdminFirstName { get; set; } = "Admin";
        public string AdminLastName { get; set; } = "";
    }

    public class PricingSection
    {
        public decimal KmRate { get; set; }
        public decimal HourRate { get; set; }
        public decimal NightSurcharge { get; set; }
        public decimal WeekendSurcharge { get; set; }
        public decimal DeadMileageRate { get; set; }
        public int DeadMileageRadiusKm { get; set; }
        public decimal VatPercent { get; set; }
        public decimal MinInvoice { get; set; }
    }

    public class PriceCategorySeed
    {
        public string Name { get; set; } = "";
        public decimal KmRate { get; set; }
        public decimal HourRate { get; set; }
        public int SortOrder { get; set; }
    }

    public class BusSeed
    {
        public string ExternalId { get; set; } = "";
        public string Name { get; set; } = "";
        public int Seats { get; set; }
        public string PriceCategory { get; set; } = "";
        public string Description { get; set; } = "";
        public List<string> Images { get; set; } = [];
        public List<string> Amenities { get; set; } = [];
        public int SortOrder { get; set; }
    }

    public class ContentSection
    {
        public string HeroImageUrl { get; set; } = "";
        public string HeroTitle { get; set; } = "";
        public string HeroSubtitle { get; set; } = "";
        public string HeroCta { get; set; } = "";
        public string Badge1 { get; set; } = "";
        public string Badge2 { get; set; } = "";
        public string Badge3 { get; set; } = "";
        public string Badge4 { get; set; } = "";
        public string FooterAbout { get; set; } = "";
        public string RecruitTitle { get; set; } = "";
        public string RecruitText { get; set; } = "";
        public string PriceDisclaimer { get; set; } = "";
        public string OmOssHeroImageUrl { get; set; } = "";
        public string OmOssIntroQuote { get; set; } = "";
        public string OmOssCol1Title { get; set; } = "";
        public string OmOssCol1Text { get; set; } = "";
        public string OmOssCol2Title { get; set; } = "";
        public string OmOssCol2Text { get; set; } = "";
        public string OmOssCol3Title { get; set; } = "";
        public string OmOssCol3Text { get; set; } = "";
        public string ServicesTitle { get; set; } = "";
        public string ServicesSubtitle { get; set; } = "";
        public string ServicesBullet1 { get; set; } = "";
        public string ServicesBullet2 { get; set; } = "";
        public string ServicesBullet3 { get; set; } = "";
        public string ServicesBullet4 { get; set; } = "";
        public string ServicesImage1 { get; set; } = "";
        public string ServicesImage2 { get; set; } = "";
        public string ServicesImage3 { get; set; } = "";
        public string Stat1Value { get; set; } = "";
        public string Stat1Label { get; set; } = "";
        public string Stat2Value { get; set; } = "";
        public string Stat2Label { get; set; } = "";
        public string Stat3Value { get; set; } = "";
        public string Stat3Label { get; set; } = "";
        public string Stat4Value { get; set; } = "";
        public string Stat4Label { get; set; } = "";
        public bool RecruitmentEnabled { get; set; }
        public string RecruitmentTeaserTitle { get; set; } = "";
        public string RecruitmentTeaserText { get; set; } = "";
        public string RecruitmentTeaserImageUrl { get; set; } = "";
        public string RecruitmentPageTitle { get; set; } = "";
        public string RecruitmentDescription { get; set; } = "";
        public string RecruitmentPageImageUrl { get; set; } = "";
        public string TermsContent { get; set; } = "";
        public string PrivacyContent { get; set; } = "";
        public string BankAccountNumber { get; set; } = "";
    }

    public class DeploymentSection
    {
        public string RenderServiceName { get; set; } = "";
        public string CloudflareWorkerName { get; set; } = "";
        public List<string> CorsOrigins { get; set; } = [];
        public string JwtIssuer { get; set; } = "";
        public string JwtAudience { get; set; } = "";
        public string EmailFromAddress { get; set; } = "";
        public string EmailNotifyTo { get; set; } = "";
    }

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static CustomerConfig Load(IConfiguration config)
    {
        var slug = config["Customer:Slug"] ?? "kjosavik";
        var path = ResolvePath(slug);
        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<CustomerConfig>(json, JsonOptions)
            ?? throw new InvalidOperationException($"Failed to parse customer config for slug '{slug}' at {path}");
    }

    // Docker (dockerContext: repo root) copies customers/ alongside the published app at WORKDIR,
    // so "./customers" resolves there. Local `dotnet run` from backend/ has its working directory
    // at backend/, one level below the repo root, so "../customers" resolves there instead.
    private static string ResolvePath(string slug)
    {
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "customers", slug, "config.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "customers", slug, "config.json"),
        };
        foreach (var candidate in candidates)
            if (File.Exists(candidate)) return candidate;

        throw new FileNotFoundException(
            $"No customer config found for slug '{slug}'. Checked: {string.Join(", ", candidates)}");
    }
}
