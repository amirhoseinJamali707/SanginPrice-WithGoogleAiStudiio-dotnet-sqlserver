using SanginPrice.Business.DTOs;

namespace SanginPrice.Business.Interfaces;

public interface IPriceService
{
    Task<IEnumerable<ProductPriceDto>> GetPricesByProductAsync(int productId, string username);
    Task<IEnumerable<ProductPriceDto>> GetPricesByProductNameAsync(string productName, string username);
    Task<ProductPriceDto?> AddPriceAsync(ProductPriceDto dto, string username);
    Task<ProductPriceDto?> UpdatePriceAsync(int priceId, ProductPriceDto dto, string username);
    Task<bool> DeletePriceAsync(int priceId, string username);
    Task<bool> MarkPriceAsInvalidAsync(int priceId, string username);
    Task<IEnumerable<ProductPriceDto>> GeneralSearchPricesAsync(string search, string searchIn, string fromDate, string toDate, string supplierName, string fromUser, int validityStatus);
}
