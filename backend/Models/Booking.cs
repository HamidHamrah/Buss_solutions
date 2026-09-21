namespace BusSolutionApi.Models;

public class Booking
{
    public int Id { get; set; }
    public string Reference { get; set; } = "";

    // Route
    public string FromAddress { get; set; } = "";
    public string ToAddress { get; set; } = "";
    public List<string> Stops { get; set; } = [];
    public DateTime DepartureDate { get; set; }
    public string DepartureTime { get; set; } = "";
    public string TripType { get; set; } = "one-way"; // one-way | return
    public DateTime? ReturnDate { get; set; }
    public string ReturnTime { get; set; } = "";
    public bool BusOnStay { get; set; }
    public int? StayDurationHours { get; set; }

    // Bus & passengers
    public string? BusId { get; set; }
    public string BusName { get; set; } = "";
    public int Passengers { get; set; }
    public int BusCount { get; set; } = 1;
    public bool NeedsTrailer { get; set; }
    public bool NeedsWheelchair { get; set; }

    // Extras
    public List<string> SelectedExtras { get; set; } = [];

    // Price snapshot — EstimatedBase/Vat are the calculated baseline (same formula the
    // public booking flow uses); PriceAdjustment is an optional admin-added delta (can be
    // negative) on top, and EstimatedTotal always includes it.
    public decimal EstimatedBase { get; set; }
    public decimal EstimatedVat { get; set; }
    public decimal EstimatedTotal { get; set; }
    public decimal PriceAdjustment { get; set; } = 0;
    public string? PriceAdjustmentNote { get; set; }
    public int DistanceKm { get; set; }

    // Itemized ad-hoc charges added during/after planning (extra hours, cleaning fees, etc.) —
    // each one adds to EstimatedTotal on its own, unlike PriceAdjustment which is a single
    // overwritable delta. Locked once InvoiceNumber is set (see BookingsController).
    public List<ExtraCharge> ExtraCharges { get; set; } = [];

    // Contact
    public string CustomerType { get; set; } = "privat"; // privat | org
    public string ContactName { get; set; } = "";
    public string ContactEmail { get; set; } = "";
    public string ContactPhone { get; set; } = "";
    public string? OrgName { get; set; }
    public string? OrgNumber { get; set; }
    public string? Message { get; set; }

    // Invoice
    public string? InvoiceNumber { get; set; }
    public DateTime? InvoiceDate { get; set; }
    // Set only once the invoice has actually been emailed to the customer via Fiken —
    // InvoiceNumber alone just means a draft/number was generated. Price/extra-charge edits
    // are locked once this is set, not at InvoiceNumber generation.
    public DateTime? InvoiceSentAt { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    public DateTime? PaidDate { get; set; }

    // Fiken sync
    public string? FikenInvoiceId { get; set; }
    public DateTime? FikenSyncedAt { get; set; }

    // Meta
    public BookingStatus Status { get; set; } = BookingStatus.New;
    public string? AdminNotes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum BookingStatus
{
    New = 0,
    Confirmed = 1,
    Cancelled = 2,
    Quoted = 3,
}

public enum PaymentStatus
{
    Unpaid = 0,
    Paid = 1,
}

public class ExtraCharge
{
    public string Description { get; set; } = "";
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
