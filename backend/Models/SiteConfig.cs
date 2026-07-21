namespace BusSolutionApi.Models;

public class SiteConfig
{
    public int Id { get; set; }

    // Pricing
    public decimal KmRate { get; set; } = 18;
    public decimal HourRate { get; set; } = 850;
    public decimal NightSurcharge { get; set; } = 40;
    public decimal WeekendSurcharge { get; set; } = 40;
    public decimal DeadMileageRate { get; set; } = 20;
    public int DeadMileageRadiusKm { get; set; } = 30;
    public decimal VatPercent { get; set; } = 12;
    public decimal MinInvoice { get; set; } = 3000;
    public List<CustomPricingVariable> CustomVariables { get; set; } = [];

    // Content
    public string HeroImageUrl { get; set; } = "https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=1600&q=80";
    public string HeroTitle { get; set; } = "En flott og minneverdig reise";
    public string HeroSubtitle { get; set; } = "Pålitelig persontransport siden 2023";
    public string HeroCta { get; set; } = "Planlegg reisen";
    public string Badge1 { get; set; } = "Etablert 2023";
    public string Badge2 { get; set; } = "Erfarne sjåfører";
    public string Badge3 { get; set; } = "Punktlig drift";
    public string Badge4 { get; set; } = "Internasjonalt";
    public string Phone { get; set; } = "95 45 38 07";
    public string Email { get; set; } = "post@kjosavikreiser.no";
    public string Address { get; set; } = "Fosseikeveien 3, Fosseikeland";
    public string OrgNr { get; set; } = "";
    public string FooterAbout { get; set; } = "Kjosavik Reiser AS er Jærens pålitelige partner for bussreiser siden 2023.";
    public string RecruitTitle { get; set; } = "Bli sjåfør hos oss";
    public string RecruitText { get; set; } = "Vi ser alltid etter dyktige og engasjerte sjåfører.";
    public string PriceDisclaimer { get; set; } = "Prisen forutsetter at turen starter, slutter eller er innom Jæren-området med ca. 30 km radius. Tomkjøring utover 30 km radius beregnes 20 kr/km (per vei). Nattillegg mellom kl 21:00–06:00 beregnes 40% ekstra av timeprisen.";

    public string OmOssHeroImageUrl { get; set; } = "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1600&q=80";

    // Om oss page
    public string OmOssIntroQuote { get; set; } = "Et turbusselskap på Jæren som satser på komfortable og miljøvennlige busser og et høyt sikkerhetsnivå.";
    public string OmOssCol1Title { get; set; } = "Om oss";
    public string OmOssCol1Text { get; set; } = "Kjosavik Reiser ble opprettet våren 2023 av Bente Malmin og Kjartan Kjosavik. Vi har kontor og garasje i Fosseikeveien 3 på Fosseikeland, der Bente har kaffen klar når du stikker innom.\n\nI garasjen har vi flere store turbusser som varierer fra 48 til 58 seter, i tillegg til en minibuss på 19 seter. Vi tar alle typer oppdrag og arrangerer noen turer i løpet av året, med og uten guide — men alltid med en smilende og godt erfaren sjåfør.\n\nVi synes det er viktig å støtte idretten lokalt, blant annet gjennom samarbeid med flere idrettslag som vi kjører til og fra kamper og turneringer.";
    public string OmOssCol2Title { get; set; } = "Våre verdier";
    public string OmOssCol2Text { get; set; } = "Vi jobber alltid for å finne den beste løsningen for kunden.\n\nVi setter sikkerhet i fokus, med å holde utstyr i topp stand og vi følger nøye kjøre- og hviletidsbestemmelser.\n\nVi har bare kjøretøy med utslippskrav Euro 5 og Euro 6. Sjåførene har vært gjennom miljøkjøringskurs for minst mulig utslipp.";
    public string OmOssCol3Title { get; set; } = "Service";
    public string OmOssCol3Text { get; set; } = "Vi vil alltid gjøre vårt ytterste for at du som passasjer skal føle deg vel tatt vare på.\n\nVåre sjåfører er der for deg og gjør sitt ytterste for å gi det lille ekstra, slik at du får den servicen du forventer.\n\nVårt mål er at du sitter igjen med en flott og minneverdig opplevelse med oss i Kjosavik Reiser AS.";

    // Home — services section
    public string ServicesTitle { get; set; } = "Bussreiser for alle typer oppdrag";
    public string ServicesSubtitle { get; set; } = "Fra dagsturer på Jæren til charterturer i Europa — vi sørger for at du og dine reisende kommer trygt og komfortabelt frem.";
    public string ServicesBullet1 { get; set; } = "Skoleturer og klassereiser";
    public string ServicesBullet2 { get; set; } = "Bedriftsarrangementer";
    public string ServicesBullet3 { get; set; } = "Charterturer inn- og utland";
    public string ServicesBullet4 { get; set; } = "Konserter og arrangementer";

    // Home — services section images
    public string ServicesImage1 { get; set; } = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80";
    public string ServicesImage2 { get; set; } = "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&q=80";
    public string ServicesImage3 { get; set; } = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80";

    // Home — stats strip
    public string Stat1Value { get; set; } = "2023";
    public string Stat1Label { get; set; } = "Etablert på Jæren";
    public string Stat2Value { get; set; } = "4";
    public string Stat2Label { get; set; } = "Busser i flåten";
    public string Stat3Value { get; set; } = "Euro 5–6";
    public string Stat3Label { get; set; } = "Miljøstandard";
    public string Stat4Value { get; set; } = "100 %";
    public string Stat4Label { get; set; } = "Dedikerte sjåfører";

    // Recruitment
    public bool RecruitmentEnabled { get; set; } = false;
    public string RecruitmentTeaserTitle { get; set; } = "Vi trenger flere sjåfører!";
    public string RecruitmentTeaserText { get; set; } = "Vil du kjøre for et selskap der sjåførene faktisk betyr noe? Vi ser alltid etter dyktige og engasjerte sjåfører til faste stillinger og tilkallingsstillinger.";
    public string RecruitmentTeaserImageUrl { get; set; } = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80";
    public string RecruitmentPageTitle { get; set; } = "Søk på stillingen som bussjåfør";
    public string RecruitmentDescription { get; set; } = "Vil du kjøre for et selskap der sjåførene faktisk betyr noe?\n\nVi søker dyktige bussjåfører til faste stillinger og tilkallingsstillinger – både storbuss og minibuss.\n\nHos oss er sjåførene selve fundamentet. Vi vet at det er dere som skaper trygghet, opplevelser og kvalitet – hver eneste dag. Derfor tilbyr vi ikke bare konkurransedyktige betingelser, men et arbeidsmiljø der folk ser hverandre, støtter hverandre og trives sammen.\n\n**Hvorfor velge oss?**\n- Lønn med garanti og ryddige vilkår\n- Konkurransedyktig lønn med garantert 1920 timer per år\n- Meget gode forsikringer, inkludert helseforsikring\n- Bedriftshelsetjeneste\n- Vi dekker YSK-kurs\n- Strukturert opplæring ved oppstart\n- Fast buss for faste ansatte\n- Moderne busspark og variert kjøring\n\n**Kvalifikasjoner**\n- Førerkort D1/D/DE\n- Gyldig YSK, sjåførkort og kjøreseddel\n- Erfaring med tunge kjøretøy er en fordel\n- Behersker et skandinavisk språk\n- Grunnleggende digitale ferdigheter\n- Norsk personnummer eller D-nummer";
    public string RecruitmentPageImageUrl { get; set; } = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80";

    // Social media
    public string SocialFacebook { get; set; } = "";
    public string SocialInstagram { get; set; } = "";
    public string SocialLinkedin { get; set; } = "";

    // SMTP
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = "";
    public string SmtpPassword { get; set; } = "";
    public string SmtpFromAddress { get; set; } = "post@kjosavikreiser.no";
    public string SmtpNotifyTo { get; set; } = "post@kjosavikreiser.no";

    // Pages
    public string TermsContent { get; set; } = "";
    public string PrivacyContent { get; set; } = "";

    // Invoice
    public string BankAccountNumber { get; set; } = "";

    // Admin
    public string AdminPasswordHash { get; set; } = "";

    // Identity & SEO
    public string CompanyName { get; set; } = "";
    public string BrandNamePrimary { get; set; } = "";
    public string BrandNameSecondary { get; set; } = "";
    public string SiteDomain { get; set; } = "";
    public string LogoPath { get; set; } = "/logo.png";
    public string FaviconPath { get; set; } = "/favicon.svg";
    public string OgImagePath { get; set; } = "/og-image.jpg";
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

public class CustomPricingVariable
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Type { get; set; } = "flat"; // flat | per_km | per_hour | percent
    public decimal Value { get; set; }
    public string Unit { get; set; } = "";
    public bool Optional { get; set; }
    public bool DefaultEnabled { get; set; } = true;
}
