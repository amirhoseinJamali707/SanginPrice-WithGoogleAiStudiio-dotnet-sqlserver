using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SanginPrice.DataAccess.Entities;

[Table("Contacts")]
public class Contact
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Specialty { get; set; }

    [MaxLength(50)]
    public string? Landline { get; set; }

    [MaxLength(50)]
    public string? Phone1 { get; set; }

    [MaxLength(50)]
    public string? Phone2 { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    public string? Notes { get; set; }
}
