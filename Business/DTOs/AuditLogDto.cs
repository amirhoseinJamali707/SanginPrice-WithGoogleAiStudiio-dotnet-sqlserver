namespace SanginPrice.Business.DTOs;

public class AuditLogDto
{
    public string User_id { get; set; } = string.Empty;
    public string Action_type { get; set; } = string.Empty;
    public string Target_id { get; set; } = string.Empty;
    public string Target_type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public object? Changes { get; set; }
    public string Created_at { get; set; } = string.Empty;
}
