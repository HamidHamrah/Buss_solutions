using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Data;
using BusSolutionApi.Models;

namespace BusSolutionApi.Controllers;

[ApiController]
[Route("api/config")]
public class ConfigController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var cfg = await db.SiteConfigs.FirstOrDefaultAsync();
        if (cfg == null) return NotFound();
        return Ok(ToPublicDto(cfg));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateConfigRequest req)
    {
        var cfg = await db.SiteConfigs.FirstOrDefaultAsync();
        if (cfg == null) return NotFound();

        // Pricing
        cfg.KmRate = req.KmRate;
        cfg.HourRate = req.HourRate;
        cfg.NightSurcharge = req.NightSurcharge;
        cfg.WeekendSurcharge = req.WeekendSurcharge;
        cfg.DeadMileageRate = req.DeadMileageRate;
        cfg.DeadMileageRadiusKm = req.DeadMileageRadiusKm;
        cfg.VatPercent = req.VatPercent;
        cfg.MinInvoice = req.MinInvoice;
        cfg.CustomVariables = req.CustomVariables;

        // Content
        cfg.HeroTitle = req.HeroTitle;
        cfg.HeroSubtitle = req.HeroSubtitle;
        cfg.HeroCta = req.HeroCta;
        cfg.Badge1 = req.Badge1;
        cfg.Badge2 = req.Badge2;
        cfg.Badge3 = req.Badge3;
        cfg.Badge4 = req.Badge4;
        cfg.Phone = req.Phone;
        cfg.Email = req.Email;
        cfg.Address = req.Address;
        cfg.OrgNr = req.OrgNr;
        cfg.FooterAbout = req.FooterAbout;
        cfg.HeroImageUrl = req.HeroImageUrl;
        cfg.OmOssHeroImageUrl = req.OmOssHeroImageUrl;
        cfg.OmOssIntroQuote = req.OmOssIntroQuote;
        cfg.OmOssCol1Title = req.OmOssCol1Title;
        cfg.OmOssCol1Text = req.OmOssCol1Text;
        cfg.OmOssCol2Title = req.OmOssCol2Title;
        cfg.OmOssCol2Text = req.OmOssCol2Text;
        cfg.OmOssCol3Title = req.OmOssCol3Title;
        cfg.OmOssCol3Text = req.OmOssCol3Text;
        cfg.RecruitTitle = req.RecruitTitle;
        cfg.RecruitText = req.RecruitText;
        cfg.PriceDisclaimer = req.PriceDisclaimer;

        // Home — services section
        cfg.ServicesTitle = req.ServicesTitle;
        cfg.ServicesSubtitle = req.ServicesSubtitle;
        cfg.ServicesBullet1 = req.ServicesBullet1;
        cfg.ServicesBullet2 = req.ServicesBullet2;
        cfg.ServicesBullet3 = req.ServicesBullet3;
        cfg.ServicesBullet4 = req.ServicesBullet4;
        cfg.ServicesImage1 = req.ServicesImage1;
        cfg.ServicesImage2 = req.ServicesImage2;
        cfg.ServicesImage3 = req.ServicesImage3;

        // Home — stats
        cfg.Stat1Value = req.Stat1Value;
        cfg.Stat1Label = req.Stat1Label;
        cfg.Stat2Value = req.Stat2Value;
        cfg.Stat2Label = req.Stat2Label;
        cfg.Stat3Value = req.Stat3Value;
        cfg.Stat3Label = req.Stat3Label;
        cfg.Stat4Value = req.Stat4Value;
        cfg.Stat4Label = req.Stat4Label;

        // Recruitment
        cfg.RecruitmentEnabled = req.RecruitmentEnabled;
        cfg.RecruitmentTeaserTitle = req.RecruitmentTeaserTitle;
        cfg.RecruitmentTeaserText = req.RecruitmentTeaserText;
        cfg.RecruitmentTeaserImageUrl = req.RecruitmentTeaserImageUrl;
        cfg.RecruitmentPageTitle = req.RecruitmentPageTitle;
        cfg.RecruitmentDescription = req.RecruitmentDescription;
        cfg.RecruitmentPageImageUrl = req.RecruitmentPageImageUrl;

        // Pages
        cfg.TermsContent = req.TermsContent;
        cfg.PrivacyContent = req.PrivacyContent;

        // Invoice
        cfg.BankAccountNumber = req.BankAccountNumber;

        // Identity & SEO
        cfg.CompanyName = req.CompanyName;
        cfg.BrandNamePrimary = req.BrandNamePrimary;
        cfg.BrandNameSecondary = req.BrandNameSecondary;
        cfg.SiteDomain = req.SiteDomain;
        cfg.LogoPath = req.LogoPath;
        cfg.LogoIncludesText = req.LogoIncludesText;
        cfg.FaviconPath = req.FaviconPath;
        cfg.OgImagePath = req.OgImagePath;
        cfg.FoundingYear = req.FoundingYear;
        cfg.GeoLat = req.GeoLat;
        cfg.GeoLng = req.GeoLng;
        cfg.OpeningHoursDays = req.OpeningHoursDays ?? [];
        cfg.OpeningHoursOpen = req.OpeningHoursOpen;
        cfg.OpeningHoursClose = req.OpeningHoursClose;
        cfg.OpeningHoursText = req.OpeningHoursText;
        cfg.EmergencyAvailabilityText = req.EmergencyAvailabilityText;
        cfg.FooterCertifications = req.FooterCertifications ?? [];

        await db.SaveChangesAsync();
        return Ok(ToPublicDto(cfg));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 12)
            return BadRequest(new { message = "Passord må være minst 12 tegn" });

        var cfg = await db.SiteConfigs.FirstOrDefaultAsync();
        if (cfg == null) return NotFound();

        cfg.AdminPasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await db.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("test-email")]
    public async Task<IActionResult> TestEmail([FromServices] BusSolutionApi.Services.EmailService emailService)
    {
        var cfg = await db.SiteConfigs.FirstOrDefaultAsync();
        if (cfg == null || string.IsNullOrWhiteSpace(cfg.SmtpHost))
            return BadRequest(new { message = "SMTP er ikke konfigurert." });

        var to = string.IsNullOrWhiteSpace(cfg.SmtpNotifyTo) ? cfg.SmtpFromAddress : cfg.SmtpNotifyTo;
        try
        {
            await emailService.SendContactConfirmationAsync(to, "Admin", $"Test e-post fra {cfg.CompanyName}");
            return Ok(new { message = $"Test-e-post sendt til {to}" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Sending feilet: {ex.Message}" });
        }
    }

    private static object ToPublicDto(SiteConfig cfg) => new
    {
        pricing = new
        {
            cfg.KmRate, cfg.HourRate, cfg.NightSurcharge, cfg.WeekendSurcharge,
            cfg.DeadMileageRate, cfg.DeadMileageRadiusKm, cfg.VatPercent, cfg.MinInvoice,
            cfg.CustomVariables
        },
        content = new
        {
            cfg.HeroTitle, cfg.HeroSubtitle, cfg.HeroCta,
            cfg.Badge1, cfg.Badge2, cfg.Badge3, cfg.Badge4,
            cfg.Phone, cfg.Email, cfg.Address, cfg.OrgNr,
            cfg.FooterAbout, cfg.RecruitTitle, cfg.RecruitText, cfg.PriceDisclaimer,
            cfg.HeroImageUrl, cfg.OmOssHeroImageUrl,
            cfg.OmOssIntroQuote,
            cfg.OmOssCol1Title, cfg.OmOssCol1Text,
            cfg.OmOssCol2Title, cfg.OmOssCol2Text,
            cfg.OmOssCol3Title, cfg.OmOssCol3Text,
            cfg.ServicesTitle, cfg.ServicesSubtitle,
            cfg.ServicesBullet1, cfg.ServicesBullet2, cfg.ServicesBullet3, cfg.ServicesBullet4,
            cfg.ServicesImage1, cfg.ServicesImage2, cfg.ServicesImage3,
            cfg.Stat1Value, cfg.Stat1Label, cfg.Stat2Value, cfg.Stat2Label,
            cfg.Stat3Value, cfg.Stat3Label, cfg.Stat4Value, cfg.Stat4Label,
            cfg.CompanyName, cfg.BrandNamePrimary, cfg.BrandNameSecondary, cfg.SiteDomain,
            cfg.LogoPath, cfg.LogoIncludesText, cfg.FaviconPath, cfg.OgImagePath, cfg.FoundingYear,
            cfg.GeoLat, cfg.GeoLng,
            cfg.OpeningHoursDays, cfg.OpeningHoursOpen, cfg.OpeningHoursClose, cfg.OpeningHoursText,
            cfg.EmergencyAvailabilityText, cfg.FooterCertifications,
            cfg.PrivacyContent,
        },
        termsContent = cfg.TermsContent,
        bankAccountNumber = cfg.BankAccountNumber,
        recruitmentEnabled = cfg.RecruitmentEnabled,
        recruitmentTeaserTitle = cfg.RecruitmentTeaserTitle,
        recruitmentTeaserText = cfg.RecruitmentTeaserText,
        recruitmentTeaserImageUrl = cfg.RecruitmentTeaserImageUrl,
        recruitmentPageTitle = cfg.RecruitmentPageTitle,
        recruitmentDescription = cfg.RecruitmentDescription,
        recruitmentPageImageUrl = cfg.RecruitmentPageImageUrl,
        socialFacebook = cfg.SocialFacebook,
        socialInstagram = cfg.SocialInstagram,
        socialLinkedin = cfg.SocialLinkedin,
    };
}

public record UpdateConfigRequest(
    decimal KmRate, decimal HourRate, decimal NightSurcharge, decimal WeekendSurcharge,
    decimal DeadMileageRate, int DeadMileageRadiusKm, decimal VatPercent, decimal MinInvoice,
    List<CustomPricingVariable> CustomVariables,
    string HeroTitle, string HeroSubtitle, string HeroCta,
    string Badge1, string Badge2, string Badge3, string Badge4,
    string Phone, string Email, string Address, string OrgNr,
    string FooterAbout, string RecruitTitle, string RecruitText, string PriceDisclaimer,
    string HeroImageUrl = "",
    string OmOssHeroImageUrl = "",
    string OmOssIntroQuote = "",
    string OmOssCol1Title = "Om oss",
    string OmOssCol1Text = "",
    string OmOssCol2Title = "Våre verdier",
    string OmOssCol2Text = "",
    string OmOssCol3Title = "Service",
    string OmOssCol3Text = "",
    string ServicesTitle = "Bussreiser for alle typer oppdrag",
    string ServicesSubtitle = "",
    string ServicesBullet1 = "", string ServicesBullet2 = "",
    string ServicesBullet3 = "", string ServicesBullet4 = "",
    string ServicesImage1 = "", string ServicesImage2 = "", string ServicesImage3 = "",
    string Stat1Value = "2023", string Stat1Label = "Etablert på Jæren",
    string Stat2Value = "4", string Stat2Label = "Busser i flåten",
    string Stat3Value = "Euro 5–6", string Stat3Label = "Miljøstandard",
    string Stat4Value = "100 %", string Stat4Label = "Dedikerte sjåfører",
    bool RecruitmentEnabled = false,
    string RecruitmentTeaserTitle = "",
    string RecruitmentTeaserText = "",
    string RecruitmentTeaserImageUrl = "",
    string RecruitmentPageTitle = "",
    string RecruitmentDescription = "",
    string RecruitmentPageImageUrl = "",
    string TermsContent = "",
    string PrivacyContent = "",
    string BankAccountNumber = "",
    string CompanyName = "",
    string BrandNamePrimary = "",
    string BrandNameSecondary = "",
    string SiteDomain = "",
    string LogoPath = "/logo.png",
    bool LogoIncludesText = false,
    string FaviconPath = "/favicon.svg",
    string OgImagePath = "/og-image.jpg",
    string FoundingYear = "",
    decimal GeoLat = 0,
    decimal GeoLng = 0,
    List<string>? OpeningHoursDays = null,
    string OpeningHoursOpen = "",
    string OpeningHoursClose = "",
    string OpeningHoursText = "",
    string EmergencyAvailabilityText = "",
    List<string>? FooterCertifications = null
);

public record ChangePasswordRequest(string NewPassword);
