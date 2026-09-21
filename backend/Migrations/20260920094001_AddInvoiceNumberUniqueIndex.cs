using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bus_solution_api.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceNumberUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Bookings_InvoiceNumber",
                table: "Bookings",
                column: "InvoiceNumber",
                unique: true,
                filter: "\"InvoiceNumber\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_InvoiceNumber",
                table: "Bookings");
        }
    }
}
