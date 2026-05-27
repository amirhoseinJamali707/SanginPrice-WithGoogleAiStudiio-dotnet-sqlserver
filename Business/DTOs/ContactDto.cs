namespace SanginPrice.Business.DTOs;

public class ContactDto
{
    public int? Id { get; set; }
    public string? _id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public string? Landline { get; set; }
    public string? Phone1 { get; set; }
    public string? Phone2 { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
}

public class BulkContactResultDto
{
    public bool Success { get; set; }
    public int InsertedCount { get; set; }
    public int FailedCount { get; set; }
    public List<ContactDto> Inserted { get; set; } = new();
    public List<ContactFailedItemDto> FailedList { get; set; } = new();
}

public class ContactFailedItemDto : ContactDto
{
    public string Reason { get; set; } = string.Empty;
}
