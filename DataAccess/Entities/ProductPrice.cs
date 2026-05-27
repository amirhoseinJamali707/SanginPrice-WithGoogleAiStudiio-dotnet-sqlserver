using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SanginPrice.DataAccess.Entities;

[Table("product_prices")]
public class ProductPrice
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int ProductID { get; set; }

    [MaxLength(100)]
    public string? PriceStatus { get; set; }

    [MaxLength(100)]
    public string? LastPriceUpdateDate { get; set; }

    [Required]
    [MaxLength(100)]
    public string Price { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? SupplierName { get; set; }

    [MaxLength(100)]
    public string? PriceRecorder { get; set; }

    [Required]
    [MaxLength(100)]
    public string DailyDollarRate { get; set; } = string.Empty;

    public int PriceValidityDays { get; set; } = 7;

    public string? EstimatedPrice { get; set; }

    [MaxLength(100)]
    public string? SRTPriceID { get; set; }

    [MaxLength(100)]
    public string? CRMID { get; set; }

    [MaxLength(100)]
    public string? ShelfNumber { get; set; }
}
