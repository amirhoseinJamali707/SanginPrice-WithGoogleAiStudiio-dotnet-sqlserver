namespace SanginPrice.Business.DTOs;

public class ProductPriceDto
{
    public string? PartName { get; set; }
    public string? OtherNames { get; set; }
    public int PartID { get; set; }
    public string? TargetName { get; set; }
    public string? TargetModel { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? PartNumber { get; set; }
    public string? ProductInformation { get; set; }
    public int PriceId { get; set; }
    public int ProductID { get; set; }
    public string? SRTID { get; set; }
    public string? From { get; set; }
    public string? SupplierName { get; set; }
    public string? LastPriceUpdateDate { get; set; }
    public string Price { get; set; } = string.Empty;
    public string? Material { get; set; }
    public string DailyDollarRate { get; set; } = string.Empty;
    public int PriceValidityDays { get; set; } = 7;
    public string? EstimatedPrice { get; set; }
    public string? Status { get; set; }
    public string? SRTPriceID { get; set; }
    public string? CRMID { get; set; }
    public string? ShelfNumber { get; set; }
}
