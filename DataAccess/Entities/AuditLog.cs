using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SanginPrice.DataAccess.Entities;

[Table("AuditLogs")]
public class AuditLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string ActionType { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string TargetId { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string TargetType { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ChangesJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
