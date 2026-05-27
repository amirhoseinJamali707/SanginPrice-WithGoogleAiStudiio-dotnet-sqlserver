namespace SanginPrice.Business.DTOs;

public class MachinePartDto
{
    public string PartName { get; set; } = string.Empty;
    public string? OtherNames { get; set; }
    public int PartID { get; set; }
    public string? TargetName { get; set; }
    public string? TargetModel { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? PartNumber { get; set; }
    public string? ProductInformation { get; set; }
    public int ProductID { get; set; }
    public string? SRTID { get; set; }
    public string Status { get; set; } = "New";
}
