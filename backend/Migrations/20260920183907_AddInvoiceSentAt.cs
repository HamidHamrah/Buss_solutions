using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bus_solution_api.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceSentAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "InvoiceSentAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InvoiceSentAt",
                table: "Bookings");
        }
    }
}
