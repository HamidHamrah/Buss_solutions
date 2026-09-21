using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bus_solution_api.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingExtraCharges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExtraCharges",
                table: "Bookings",
                type: "text",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExtraCharges",
                table: "Bookings");
        }
    }
}
