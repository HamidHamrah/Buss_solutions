using Microsoft.EntityFrameworkCore;
using BusSolutionApi.Models;
using System.Text.Json;

namespace BusSolutionApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<SiteConfig> SiteConfigs => Set<SiteConfig>();
    public DbSet<Bus> Buses => Set<Bus>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<PriceCategory> PriceCategories => Set<PriceCategory>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<BusAssignment> BusAssignments => Set<BusAssignment>();
    public DbSet<TripStop> TripStops => Set<TripStop>();
    public DbSet<TripLogEntry> TripLogEntries => Set<TripLogEntry>();
    public DbSet<BusPositionPing> BusPositionPings => Set<BusPositionPing>();
    public DbSet<UploadedAsset> UploadedAssets => Set<UploadedAsset>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var jsonOptions = new JsonSerializerOptions();

        modelBuilder.Entity<SiteConfig>()
            .Property(e => e.CustomVariables)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<CustomPricingVariable>>(v, jsonOptions) ?? new List<CustomPricingVariable>());

        modelBuilder.Entity<SiteConfig>()
            .Property(e => e.OpeningHoursDays)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());

        modelBuilder.Entity<SiteConfig>()
            .Property(e => e.FooterCertifications)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());

        modelBuilder.Entity<Bus>()
            .Property(e => e.Images)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());

        modelBuilder.Entity<Bus>()
            .Property(e => e.Amenities)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());

        modelBuilder.Entity<Booking>()
            .Property(e => e.Stops)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());

        modelBuilder.Entity<Booking>()
            .Property(e => e.SelectedExtras)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());

        modelBuilder.Entity<ServiceCategory>()
            .Property(e => e.Body)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());

        modelBuilder.Entity<ServiceCategory>()
            .Property(e => e.Highlights)
            .HasConversion(
                v => JsonSerializer.Serialize(v, jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());

        modelBuilder.Entity<UploadedAsset>(entity =>
        {
            entity.Property(a => a.FileName).IsRequired().HasMaxLength(260);
            entity.Property(a => a.ContentType).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Data).IsRequired();
            entity.Property(a => a.CreatedAt).IsRequired();

            entity.HasIndex(a => a.CreatedAt);
        });

        modelBuilder.Entity<Driver>(entity =>
        {
            entity.HasIndex(d => d.Phone).IsUnique();
        });

        modelBuilder.Entity<BusAssignment>(entity =>
        {
            entity.HasOne(a => a.Booking)
                .WithMany()
                .HasForeignKey(a => a.BookingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(a => a.Stops)
                .WithOne(s => s.BusAssignment)
                .HasForeignKey(s => s.BusAssignmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(a => a.LogEntries)
                .WithOne(l => l.BusAssignment)
                .HasForeignKey(l => l.BusAssignmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(a => a.PositionPings)
                .WithOne(p => p.BusAssignment)
                .HasForeignKey(p => p.BusAssignmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TripStop>(entity =>
        {
            entity.HasMany(s => s.LogEntries)
                .WithOne(l => l.TripStop)
                .HasForeignKey(l => l.TripStopId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TripLogEntry>(entity =>
        {
            entity.HasOne(l => l.CreatedByDriver)
                .WithMany()
                .HasForeignKey(l => l.CreatedByDriverId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
