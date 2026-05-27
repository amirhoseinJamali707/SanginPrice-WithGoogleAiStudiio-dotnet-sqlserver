using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SanginPrice.DataAccess.Entities;

[Table("part_name")]
public class ProductCategory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string PartName { get; set; } = string.Empty;

    public string? OtherNames { get; set; }

    [MaxLength(255)]
    public string? PartCollection { get; set; }

    public int ViewCount { get; set; } = 0;
    public int Views1Month { get; set; } = 0;
    public int Views3Months { get; set; } = 0;
    public int Views6Months { get; set; } = 0;
    public int Views1Year { get; set; } = 0;
}
