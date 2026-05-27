using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SanginPrice.DataAccess.Entities;

[Table("DailyViews")]
public class DailyView
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string ItemId { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? TargetId { get; set; }

    [Required]
    [MaxLength(10)]
    public string Date { get; set; } = string.Empty;

    public int Count { get; set; } = 0;
}
