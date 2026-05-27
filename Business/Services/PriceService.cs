using Microsoft.EntityFrameworkCore;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;
using SanginPrice.DataAccess;
using SanginPrice.DataAccess.Entities;

namespace SanginPrice.Business.Services;

public class PriceService : IPriceService
{
    private readonly AppDbContext _context;

    public PriceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductPriceDto>> GetPricesByProductAsync(int productId, string username)
    {
        var listQuery = from p in _context.ProductPrices
                        join m in _context.MachineParts on p.ProductID equals m.Id
                        join c in _context.ProductCategories on m.PartID equals c.Id
                        where p.ProductID == productId && p.PriceStatus != "deleted"
                        select new { p, m, c };

        var list = await listQuery.ToListAsync();

        var part = await _context.MachineParts.FirstOrDefaultAsync(m => m.Id == productId);
        if (part != null)
        {
            part.ViewCount++;
            part.Views1Month++;
            part.Views3Months++;
            part.Views6Months++;
            part.Views1Year++;

            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var dView = await _context.DailyViews
                .FirstOrDefaultAsync(d => d.ItemId == productId.ToString() && d.Date == today);

            if (dView != null)
            {
                dView.Count++;
            }
            else
            {
                _context.DailyViews.Add(new DailyView { ItemId = productId.ToString(), TargetId = "product", Date = today, Count = 1 });
            }

            await _context.SaveChangesAsync();
        }

        return list.Select(x => MapToDto(x.p, x.m, x.c));
    }

    public async Task<ProductPriceDto?> AddPriceAsync(ProductPriceDto dto, string username)
    {
        if (string.IsNullOrWhiteSpace(dto.Price)) return null;

        var product = await _context.MachineParts.FirstOrDefaultAsync(m => m.Id == dto.ProductID);
        if (product == null) return null;

        var category = await _context.ProductCategories.FirstOrDefaultAsync(c => c.Id == product.PartID);
        if (category == null) return null;

        var price = new ProductPrice
        {
            ProductID = dto.ProductID,
            PriceStatus = "active",
            LastPriceUpdateDate = GetPersianDateNow(),
            Price = dto.Price.Replace(",", ""),
            DailyDollarRate = dto.DailyDollarRate?.Replace(",", "") ?? "0",
            PriceValidityDays = dto.PriceValidityDays,
            EstimatedPrice = dto.EstimatedPrice,
            SupplierName = dto.SupplierName?.Trim(),
            PriceRecorder = username,
            SRTPriceID = dto.SRTPriceID?.Trim(),
            CRMID = dto.CRMID?.Trim(),
            ShelfNumber = dto.ShelfNumber?.Trim()
        };

        _context.ProductPrices.Add(price);
        await _context.SaveChangesAsync();

        var desc = $"افزودن قیمت جدید برای کالا: {product.ProductName} با مبلغ {price.Price}";
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = username,
            ActionType = "insert_price",
            TargetId = price.Id.ToString(),
            TargetType = "price",
            Description = desc
        });
        await _context.SaveChangesAsync();

        return MapToDto(price, product, category);
    }

    public async Task<ProductPriceDto?> UpdatePriceAsync(int priceId, ProductPriceDto dto, string username)
    {
        var price = await _context.ProductPrices.FirstOrDefaultAsync(p => p.Id == priceId);
        if (price == null) return null;

        var product = await _context.MachineParts.FirstOrDefaultAsync(m => m.Id == price.ProductID);
        if (product == null) return null;

        var category = await _context.ProductCategories.FirstOrDefaultAsync(c => c.Id == product.PartID);
        if (category == null) return null;

        var oldPrice = price.Price;

        price.SupplierName = dto.SupplierName?.Trim();
        price.LastPriceUpdateDate = GetPersianDateNow();
        price.Price = dto.Price.Replace(",", "");
        price.DailyDollarRate = dto.DailyDollarRate?.Replace(",", "") ?? "0";
        price.PriceValidityDays = dto.PriceValidityDays;
        price.EstimatedPrice = dto.EstimatedPrice;
        price.SRTPriceID = dto.SRTPriceID?.Trim();
        price.CRMID = dto.CRMID?.Trim();
        price.ShelfNumber = dto.ShelfNumber?.Trim();

        await _context.SaveChangesAsync();

        var desc = $"ویرایش قیمت کالا {product.ProductName} از {oldPrice} به {price.Price}";
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = username,
            ActionType = "update_price",
            TargetId = priceId.ToString(),
            TargetType = "price",
            Description = desc,
            ChangesJson = $"{{\"old_price\":\"{oldPrice}\",\"new_price\":\"{price.Price}\"}}"
        });
        await _context.SaveChangesAsync();

        return MapToDto(price, product, category);
    }

    public async Task<bool> DeletePriceAsync(int priceId, string username)
    {
        var price = await _context.ProductPrices.FirstOrDefaultAsync(p => p.Id == priceId);
        if (price == null) return false;

        var product = await _context.MachineParts.FirstOrDefaultAsync(m => m.Id == price.ProductID);
        var prodName = product?.ProductName ?? "نامشخص";

        price.PriceStatus = "deleted";
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = username,
            ActionType = "update_price",
            TargetId = priceId.ToString(),
            TargetType = "price",
            Description = $"حذف فیزیکی قیمت شناسه: {priceId} کالا: {prodName}"
        });
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> MarkPriceAsInvalidAsync(int priceId, string username)
    {
        var price = await _context.ProductPrices.FirstOrDefaultAsync(p => p.Id == priceId);
        if (price == null) return false;

        var product = await _context.MachineParts.FirstOrDefaultAsync(m => m.Id == price.ProductID);
        var prodName = product?.ProductName ?? "نامشخص";

        price.PriceStatus = "نامعتبر";
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = username,
            ActionType = "update_price",
            TargetId = priceId.ToString(),
            TargetType = "price",
            Description = $"تغییر وضعیت قیمت به نامعتبر شناسه: {priceId} کالا: {prodName}"
        });
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<ProductPriceDto>> GeneralSearchPricesAsync(
        string search, string searchIn, string fromDate, string toDate, 
        string supplierName, string fromUser, int validityStatus)
    {
        var baseQuery = from p in _context.ProductPrices
                        join m in _context.MachineParts on p.ProductID equals m.Id
                        join c in _context.ProductCategories on m.PartID equals c.Id
                        where p.PriceStatus != "deleted"
                        select new { p, m, c };

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            if (searchIn == "partNo")
            {
                baseQuery = baseQuery.Where(x => x.m.PartNumber != null && x.m.PartNumber.ToLower().Contains(term));
            }
            else if (searchIn == "srt")
            {
                baseQuery = baseQuery.Where(x => x.m.SrtID != null && x.m.SrtID.ToLower().Contains(term));
            }
            else
            {
                baseQuery = baseQuery.Where(x => x.m.ProductName.ToLower().Contains(term));
            }
        }

        if (!string.IsNullOrWhiteSpace(supplierName))
        {
            var sup = supplierName.Trim().ToLower();
            baseQuery = baseQuery.Where(x => x.p.SupplierName != null && x.p.SupplierName.ToLower().Contains(sup));
        }

        if (!string.IsNullOrWhiteSpace(fromUser))
        {
            var usr = fromUser.Trim().ToLower();
            baseQuery = baseQuery.Where(x => x.p.PriceRecorder != null && x.p.PriceRecorder.ToLower().Contains(usr));
        }

        if (!string.IsNullOrWhiteSpace(fromDate))
        {
            baseQuery = baseQuery.Where(x => string.Compare(x.p.LastPriceUpdateDate, fromDate) >= 0);
        }

        if (!string.IsNullOrWhiteSpace(toDate))
        {
            baseQuery = baseQuery.Where(x => string.Compare(x.p.LastPriceUpdateDate, toDate) <= 0);
        }

        var results = await baseQuery.ToListAsync();

        if (validityStatus > 0)
        {
            results = results.Where(x => {
                var isExpired = x.p.PriceStatus == "نامعتبر" || IsExpired(x.p.LastPriceUpdateDate, x.p.PriceValidityDays);
                return validityStatus == 1 ? !isExpired : isExpired;
            }).ToList();
        }

        return results.Select(x => MapToDto(x.p, x.m, x.c));
    }

    private ProductPriceDto MapToDto(ProductPrice p, MachinePart m, ProductCategory c)
    {
        return new ProductPriceDto
        {
            PartName = c.PartName,
            OtherNames = c.OtherNames,
            PartID = m.PartID,
            TargetName = m.TargetName,
            TargetModel = m.TargetModel,
            ProductName = m.ProductName,
            PartNumber = m.PartNumber,
            ProductInformation = m.ProductInformation,
            PriceId = p.Id,
            ProductID = p.ProductID,
            SRTID = m.SrtID,
            From = p.PriceRecorder,
            SupplierName = p.SupplierName,
            LastPriceUpdateDate = p.LastPriceUpdateDate,
            Price = p.Price,
            DailyDollarRate = p.DailyDollarRate,
            PriceValidityDays = p.PriceValidityDays,
            EstimatedPrice = p.EstimatedPrice,
            Status = p.PriceStatus,
            SRTPriceID = p.SRTPriceID,
            CRMID = p.CRMID,
            ShelfNumber = p.ShelfNumber
        };
    }

    private string GetPersianDateNow()
    {
        var pc = new System.Globalization.PersianCalendar();
        var now = DateTime.Now;
        return $"{pc.GetYear(now)}/{pc.GetMonth(now):00}/{pc.GetDayOfMonth(now):00}";
    }

    private bool IsExpired(string? dateStr, int validityDays)
    {
        if (string.IsNullOrEmpty(dateStr)) return true;
        try 
        {
            var parts = dateStr.Split('/');
            if (parts.Length != 3) return true;

            var pc = new System.Globalization.PersianCalendar();
            var updateDate = new DateTime(int.Parse(parts[0]), int.Parse(parts[1]), int.Parse(parts[2]), pc);
            return (DateTime.Now - updateDate).TotalDays > validityDays;
        }
        catch
        {
            return true;
        }
    }
}
