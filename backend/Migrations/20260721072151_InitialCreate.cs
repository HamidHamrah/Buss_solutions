using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace bus_solution_api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Reference = table.Column<string>(type: "text", nullable: false),
                    FromAddress = table.Column<string>(type: "text", nullable: false),
                    ToAddress = table.Column<string>(type: "text", nullable: false),
                    Stops = table.Column<string>(type: "text", nullable: false),
                    DepartureDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DepartureTime = table.Column<string>(type: "text", nullable: false),
                    TripType = table.Column<string>(type: "text", nullable: false),
                    ReturnDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReturnTime = table.Column<string>(type: "text", nullable: false),
                    BusOnStay = table.Column<bool>(type: "boolean", nullable: false),
                    StayDurationHours = table.Column<int>(type: "integer", nullable: true),
                    BusId = table.Column<string>(type: "text", nullable: false),
                    BusName = table.Column<string>(type: "text", nullable: false),
                    Passengers = table.Column<int>(type: "integer", nullable: false),
                    BusCount = table.Column<int>(type: "integer", nullable: false),
                    NeedsTrailer = table.Column<bool>(type: "boolean", nullable: false),
                    NeedsWheelchair = table.Column<bool>(type: "boolean", nullable: false),
                    SelectedExtras = table.Column<string>(type: "text", nullable: false),
                    EstimatedBase = table.Column<decimal>(type: "numeric", nullable: false),
                    EstimatedVat = table.Column<decimal>(type: "numeric", nullable: false),
                    EstimatedTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    PriceAdjustment = table.Column<decimal>(type: "numeric", nullable: false),
                    PriceAdjustmentNote = table.Column<string>(type: "text", nullable: true),
                    DistanceKm = table.Column<int>(type: "integer", nullable: false),
                    CustomerType = table.Column<string>(type: "text", nullable: false),
                    ContactName = table.Column<string>(type: "text", nullable: false),
                    ContactEmail = table.Column<string>(type: "text", nullable: false),
                    ContactPhone = table.Column<string>(type: "text", nullable: false),
                    OrgName = table.Column<string>(type: "text", nullable: true),
                    OrgNumber = table.Column<string>(type: "text", nullable: true),
                    Message = table.Column<string>(type: "text", nullable: true),
                    InvoiceNumber = table.Column<string>(type: "text", nullable: true),
                    InvoiceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaymentStatus = table.Column<int>(type: "integer", nullable: false),
                    PaidDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AdminNotes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContactMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AdminReply = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RepliedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Drivers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    Color = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    MustChangePassword = table.Column<bool>(type: "boolean", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsAdmin = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Drivers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FaqItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Question = table.Column<string>(type: "text", nullable: false),
                    Answer = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaqItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobApplications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Age = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Education = table.Column<string>(type: "text", nullable: false),
                    CurrentJob = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    CvUrl = table.Column<string>(type: "text", nullable: false),
                    LicenseFrontUrl = table.Column<string>(type: "text", nullable: false),
                    LicenseBackUrl = table.Column<string>(type: "text", nullable: false),
                    YskUrl = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobApplications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Partners",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    LogoUrl = table.Column<string>(type: "text", nullable: false),
                    WebsiteUrl = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partners", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PriceCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    KmRate = table.Column<decimal>(type: "numeric", nullable: false),
                    HourRate = table.Column<decimal>(type: "numeric", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ServiceCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Intro = table.Column<string>(type: "text", nullable: false),
                    HeroImage = table.Column<string>(type: "text", nullable: false),
                    DetailImage = table.Column<string>(type: "text", nullable: false),
                    Headline = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Highlights = table.Column<string>(type: "text", nullable: false),
                    Group = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SiteConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KmRate = table.Column<decimal>(type: "numeric", nullable: false),
                    HourRate = table.Column<decimal>(type: "numeric", nullable: false),
                    NightSurcharge = table.Column<decimal>(type: "numeric", nullable: false),
                    WeekendSurcharge = table.Column<decimal>(type: "numeric", nullable: false),
                    DeadMileageRate = table.Column<decimal>(type: "numeric", nullable: false),
                    DeadMileageRadiusKm = table.Column<int>(type: "integer", nullable: false),
                    VatPercent = table.Column<decimal>(type: "numeric", nullable: false),
                    MinInvoice = table.Column<decimal>(type: "numeric", nullable: false),
                    CustomVariables = table.Column<string>(type: "text", nullable: false),
                    HeroImageUrl = table.Column<string>(type: "text", nullable: false),
                    HeroTitle = table.Column<string>(type: "text", nullable: false),
                    HeroSubtitle = table.Column<string>(type: "text", nullable: false),
                    HeroCta = table.Column<string>(type: "text", nullable: false),
                    Badge1 = table.Column<string>(type: "text", nullable: false),
                    Badge2 = table.Column<string>(type: "text", nullable: false),
                    Badge3 = table.Column<string>(type: "text", nullable: false),
                    Badge4 = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    OrgNr = table.Column<string>(type: "text", nullable: false),
                    FooterAbout = table.Column<string>(type: "text", nullable: false),
                    RecruitTitle = table.Column<string>(type: "text", nullable: false),
                    RecruitText = table.Column<string>(type: "text", nullable: false),
                    PriceDisclaimer = table.Column<string>(type: "text", nullable: false),
                    OmOssHeroImageUrl = table.Column<string>(type: "text", nullable: false),
                    OmOssIntroQuote = table.Column<string>(type: "text", nullable: false),
                    OmOssCol1Title = table.Column<string>(type: "text", nullable: false),
                    OmOssCol1Text = table.Column<string>(type: "text", nullable: false),
                    OmOssCol2Title = table.Column<string>(type: "text", nullable: false),
                    OmOssCol2Text = table.Column<string>(type: "text", nullable: false),
                    OmOssCol3Title = table.Column<string>(type: "text", nullable: false),
                    OmOssCol3Text = table.Column<string>(type: "text", nullable: false),
                    ServicesTitle = table.Column<string>(type: "text", nullable: false),
                    ServicesSubtitle = table.Column<string>(type: "text", nullable: false),
                    ServicesBullet1 = table.Column<string>(type: "text", nullable: false),
                    ServicesBullet2 = table.Column<string>(type: "text", nullable: false),
                    ServicesBullet3 = table.Column<string>(type: "text", nullable: false),
                    ServicesBullet4 = table.Column<string>(type: "text", nullable: false),
                    ServicesImage1 = table.Column<string>(type: "text", nullable: false),
                    ServicesImage2 = table.Column<string>(type: "text", nullable: false),
                    ServicesImage3 = table.Column<string>(type: "text", nullable: false),
                    Stat1Value = table.Column<string>(type: "text", nullable: false),
                    Stat1Label = table.Column<string>(type: "text", nullable: false),
                    Stat2Value = table.Column<string>(type: "text", nullable: false),
                    Stat2Label = table.Column<string>(type: "text", nullable: false),
                    Stat3Value = table.Column<string>(type: "text", nullable: false),
                    Stat3Label = table.Column<string>(type: "text", nullable: false),
                    Stat4Value = table.Column<string>(type: "text", nullable: false),
                    Stat4Label = table.Column<string>(type: "text", nullable: false),
                    RecruitmentEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    RecruitmentTeaserTitle = table.Column<string>(type: "text", nullable: false),
                    RecruitmentTeaserText = table.Column<string>(type: "text", nullable: false),
                    RecruitmentTeaserImageUrl = table.Column<string>(type: "text", nullable: false),
                    RecruitmentPageTitle = table.Column<string>(type: "text", nullable: false),
                    RecruitmentDescription = table.Column<string>(type: "text", nullable: false),
                    RecruitmentPageImageUrl = table.Column<string>(type: "text", nullable: false),
                    SocialFacebook = table.Column<string>(type: "text", nullable: false),
                    SocialInstagram = table.Column<string>(type: "text", nullable: false),
                    SocialLinkedin = table.Column<string>(type: "text", nullable: false),
                    SmtpHost = table.Column<string>(type: "text", nullable: false),
                    SmtpPort = table.Column<int>(type: "integer", nullable: false),
                    SmtpUsername = table.Column<string>(type: "text", nullable: false),
                    SmtpPassword = table.Column<string>(type: "text", nullable: false),
                    SmtpFromAddress = table.Column<string>(type: "text", nullable: false),
                    SmtpNotifyTo = table.Column<string>(type: "text", nullable: false),
                    TermsContent = table.Column<string>(type: "text", nullable: false),
                    BankAccountNumber = table.Column<string>(type: "text", nullable: false),
                    AdminPasswordHash = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Testimonials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    AvatarColor = table.Column<string>(type: "text", nullable: false),
                    AvatarImageUrl = table.Column<string>(type: "text", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Testimonials", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UploadedAssets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Data = table.Column<byte[]>(type: "bytea", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UploadedAssets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BusAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusId = table.Column<string>(type: "text", nullable: false),
                    DriverId = table.Column<int>(type: "integer", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    BookingReference = table.Column<string>(type: "text", nullable: true),
                    BookingId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CurrentLatitude = table.Column<double>(type: "double precision", nullable: true),
                    CurrentLongitude = table.Column<double>(type: "double precision", nullable: true),
                    PositionUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusAssignments_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BusAssignments_Drivers_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Drivers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Buses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExternalId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    RegistrationNumber = table.Column<string>(type: "text", nullable: false),
                    Seats = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Images = table.Column<string>(type: "text", nullable: false),
                    Amenities = table.Column<string>(type: "text", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    PriceCategoryId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Buses_PriceCategories_PriceCategoryId",
                        column: x => x.PriceCategoryId,
                        principalTable: "PriceCategories",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "BusPositionPings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusAssignmentId = table.Column<int>(type: "integer", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusPositionPings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusPositionPings_BusAssignments_BusAssignmentId",
                        column: x => x.BusAssignmentId,
                        principalTable: "BusAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TripStops",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusAssignmentId = table.Column<int>(type: "integer", nullable: false),
                    SequenceNumber = table.Column<int>(type: "integer", nullable: false),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    PlannedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActualArrival = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ActualDeparture = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripStops", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripStops_BusAssignments_BusAssignmentId",
                        column: x => x.BusAssignmentId,
                        principalTable: "BusAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TripLogEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusAssignmentId = table.Column<int>(type: "integer", nullable: false),
                    TripStopId = table.Column<int>(type: "integer", nullable: true),
                    Message = table.Column<string>(type: "text", nullable: false),
                    CreatedByDriverId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripLogEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripLogEntries_BusAssignments_BusAssignmentId",
                        column: x => x.BusAssignmentId,
                        principalTable: "BusAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TripLogEntries_Drivers_CreatedByDriverId",
                        column: x => x.CreatedByDriverId,
                        principalTable: "Drivers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TripLogEntries_TripStops_TripStopId",
                        column: x => x.TripStopId,
                        principalTable: "TripStops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusAssignments_BookingId",
                table: "BusAssignments",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_BusAssignments_DriverId",
                table: "BusAssignments",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Buses_PriceCategoryId",
                table: "Buses",
                column: "PriceCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_BusPositionPings_BusAssignmentId",
                table: "BusPositionPings",
                column: "BusAssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_Phone",
                table: "Drivers",
                column: "Phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TripLogEntries_BusAssignmentId",
                table: "TripLogEntries",
                column: "BusAssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_TripLogEntries_CreatedByDriverId",
                table: "TripLogEntries",
                column: "CreatedByDriverId");

            migrationBuilder.CreateIndex(
                name: "IX_TripLogEntries_TripStopId",
                table: "TripLogEntries",
                column: "TripStopId");

            migrationBuilder.CreateIndex(
                name: "IX_TripStops_BusAssignmentId",
                table: "TripStops",
                column: "BusAssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_UploadedAssets_CreatedAt",
                table: "UploadedAssets",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Buses");

            migrationBuilder.DropTable(
                name: "BusPositionPings");

            migrationBuilder.DropTable(
                name: "ContactMessages");

            migrationBuilder.DropTable(
                name: "FaqItems");

            migrationBuilder.DropTable(
                name: "JobApplications");

            migrationBuilder.DropTable(
                name: "Partners");

            migrationBuilder.DropTable(
                name: "ServiceCategories");

            migrationBuilder.DropTable(
                name: "SiteConfigs");

            migrationBuilder.DropTable(
                name: "Testimonials");

            migrationBuilder.DropTable(
                name: "TripLogEntries");

            migrationBuilder.DropTable(
                name: "UploadedAssets");

            migrationBuilder.DropTable(
                name: "PriceCategories");

            migrationBuilder.DropTable(
                name: "TripStops");

            migrationBuilder.DropTable(
                name: "BusAssignments");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "Drivers");
        }
    }
}
