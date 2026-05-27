namespace SanginPrice.Business.DTOs;

public class ProductCategoryDto
{
    public int PartID { get; set; }
    public string PartName { get; set; } = string.Empty;
    public string? OtherNames { get; set; }
    public string? PartCollection { get; set; }
}
