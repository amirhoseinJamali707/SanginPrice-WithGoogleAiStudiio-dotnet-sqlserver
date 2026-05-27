using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SanginPrice.DataAccess.Entities;

[Table("product_name")]
public class MachinePart
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int PartID { get; set; }

    [MaxLength(255)]
    public string? TargetName { get; set; }

    [MaxLength(255)]
    public string? TargetModel { get; set; }

    [Required]
    [MaxLength(255)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? PartNumber { get; set; }

    public string? ProductInformation { get; set; }

    [MaxLength(100)]
    public string? SrtID { get; set; }

    [MaxLength(50)]
    public string ProductStatus { get; set; } = "New";

    public int ViewCount { get; set; } = 0;
    public int Views1Month { get; set; } = 0;
    public int Views3Months { get; set; } = 0;
    public int Views6Months { get; set; } = 0;
    public int Views1Year { get; set; } = 0;
}
