using SanginPrice.Business.DTOs;

namespace SanginPrice.Business.Interfaces;

public interface IPartService
{
    Task<IEnumerable<ProductCategoryDto>> SearchCategoriesAsync(string? search1, string? search2);
    Task<ProductCategoryDto?> CreateCategoryAsync(ProductCategoryDto dto);
    Task<ProductCategoryDto?> UpdateCategoryAsync(int partId, ProductCategoryDto dto);
    Task<bool> DeleteCategoryAsync(int partId);
    Task<BulkPartResponseDto> BulkUploadCategoriesAsync(List<ProductCategoryDto> items);
}

public class BulkPartResponseDto
{
    public bool Success { get; set; }
    public int InsertedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<ProductCategoryDto> Inserted { get; set; } = new();
    public List<string> Skipped { get; set; } = new();
    public List<PartFailedItemDto> FailedList { get; set; } = new();
}

public class PartFailedItemDto : ProductCategoryDto
{
    public string Reason { get; set; } = string.Empty;
}
