using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bus_solution_api.Migrations
{
    /// <inheritdoc />
    public partial class AddFikenSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FikenApiToken",
                table: "SiteConfigs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FikenCompanySlug",
                table: "SiteConfigs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FikenInvoiceId",
                table: "Bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FikenSyncedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FikenApiToken",
                table: "SiteConfigs");

            migrationBuilder.DropColumn(
                name: "FikenCompanySlug",
                table: "SiteConfigs");

            migrationBuilder.DropColumn(
                name: "FikenInvoiceId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "FikenSyncedAt",
                table: "Bookings");
        }
    }
}
