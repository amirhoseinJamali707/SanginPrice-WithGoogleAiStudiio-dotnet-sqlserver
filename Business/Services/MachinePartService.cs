using Microsoft.EntityFrameworkCore;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;
using SanginPrice.DataAccess;
using SanginPrice.DataAccess.Entities;

namespace SanginPrice.Business.Services;

public class MachinePartService : IMachinePartService
{
    private readonly AppDbContext _context;

    public MachinePartService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MachinePartDto>> GetPartsByCategoryAsync(int partId, string? search)
    {
        var query = from m in _context.MachineParts
                    join c in _context.ProductCategories on m.PartID equals c.Id
                    where m.PartID == partId
                    select new { m, c.PartName, c.OtherNames };

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.m.ProductName.ToLower().Contains(term)
                                  || (x.m.PartNumber != null && x.m.PartNumber.ToLower().Contains(term)));
        }

        var list = await query.ToListAsync();

        var category = await _context.ProductCategories.FirstOrDefaultAsync(c => c.Id == partId);
        if (category != null)
        {
            category.ViewCount++;
            category.Views1Month++;
            category.Views3Months++;
            category.Views6Months++;
            category.Views1Year++;
            await _context.SaveChangesAsync();
        }

        return list.Select(x => new MachinePartDto
        {
            PartName = x.PartName,
            OtherNames = x.OtherNames,
            PartID = x.m.PartID,
            TargetName = x.m.TargetName,
            TargetModel = x.m.TargetModel,
            ProductName = x.m.ProductName,
            PartNumber = x.m.PartNumber,
            ProductInformation = x.m.ProductInformation,
            ProductID = x.m.Id,
            SRTID = x.m.SrtID,
            Status = x.m.ProductStatus
        });
    }

    public async Task<MachinePartDto?> CreatePartAsync(MachinePartDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ProductName)) return null;

        var matchingCat = await _context.ProductCategories.FirstOrDefaultAsync(c => c.Id == dto.PartID);
        if (matchingCat == null) return null;

        var duplicate = await _context.MachineParts
            .AnyAsync(m => m.ProductName.ToLower() == dto.ProductName.Trim().ToLower());
        if (duplicate) return null;

        var part = new MachinePart
        {
            PartID = dto.PartID,
            TargetName = dto.TargetName,
            TargetModel = dto.TargetModel,
            ProductName = dto.ProductName.Trim(),
            PartNumber = dto.PartNumber,
            ProductInformation = dto.ProductInformation,
            SrtID = dto.SRTID,
            ProductStatus = string.IsNullOrEmpty(dto.Status) ? "New" : dto.Status
        };

        _context.MachineParts.Add(part);
        await _context.SaveChangesAsync();

        dto.ProductID = part.Id;
        dto.PartName = matchingCat.PartName;
        dto.OtherNames = matchingCat.OtherNames;
        return dto;
    }

    public async Task<MachinePartDto?> UpdatePartAsync(int productId, MachinePartDto dto)
    {
        var part = await _context.MachineParts.FirstOrDefaultAsync(p => p.Id == productId);
        if (part == null) return null;

        var matchingCat = await _context.ProductCategories.FirstOrDefaultAsync(c => c.Id == dto.PartID);
        if (matchingCat == null) return null;

        part.PartID = dto.PartID;
        part.TargetName = dto.TargetName;
        part.TargetModel = dto.TargetModel;
        part.ProductName = dto.ProductName;
        part.PartNumber = dto.PartNumber;
        part.ProductInformation = dto.ProductInformation;
        part.SrtID = dto.SRTID;
        part.ProductStatus = dto.Status;

        await _context.SaveChangesAsync();

        dto.ProductID = productId;
        dto.PartName = matchingCat.PartName;
        dto.OtherNames = matchingCat.OtherNames;
        return dto;
    }

    public async Task<bool> DeletePartAsync(int productId)
    {
        var part = await _context.MachineParts.FirstOrDefaultAsync(p => p.Id == productId);
        if (part == null) return false;

        _context.MachineParts.Remove(part);

        // Delete prices associated with this product
        var prices = await _context.ProductPrices.Where(pr => pr.ProductID == productId).ToListAsync();
        _context.ProductPrices.RemoveRange(prices);

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<BulkPartUploadResultDto> BulkUploadPartsAsync(List<MachinePartDto> items, bool isMethod2)
    {
        var result = new BulkPartUploadResultDto();

        var categories = await _context.ProductCategories.ToListAsync();

        foreach (var item in items)
        {
            string targetName = item.TargetName?.Trim() ?? "";
            string targetModel = item.TargetModel?.Trim() ?? "";
            string productName = item.ProductName?.Trim() ?? "";

            if (isMethod2)
            {
                if (string.IsNullOrEmpty(item.ProductName))
                {
                    result.Failed.Add(new MachinePartFailedItemDto { Error = "نام کالا (ProductName) الزامی است" });
                    continue;
                }

                var extracted = ExtractMachinery(item.ProductName);
                if (extracted == null)
                {
                    result.Failed.Add(new MachinePartFailedItemDto { ProductName = item.ProductName, Error = "مشخصه ماشین‌آلات در نام کالا یافت نشد" });
                    continue;
                }

                targetName = extracted.Item1;
                targetModel = extracted.Item2;
                productName = item.ProductName;
            }

            if (string.IsNullOrEmpty(productName))
            {
                result.Failed.Add(new MachinePartFailedItemDto { Error = "نام کالا الزامی است" });
                continue;
            }

            var matchingCat = categories.FirstOrDefault(c => c.PartName.ToLower() == targetName.ToLower());
            if (matchingCat == null)
            {
                var newCat = new ProductCategory { PartName = targetName };
                _context.ProductCategories.Add(newCat);
                await _context.SaveChangesAsync();
                
                categories.Add(newCat);
                matchingCat = newCat;
            }

            var duplicate = await _context.MachineParts.AnyAsync(m => m.ProductName.ToLower() == productName.ToLower());

            if (duplicate)
            {
                result.Failed.Add(new MachinePartFailedItemDto { ProductName = productName, Error = "کالای تکراری است" });
                continue;
            }

            try
            {
                var newPart = new MachinePart
                {
                    PartID = matchingCat.Id,
                    TargetName = targetName,
                    TargetModel = targetModel,
                    ProductName = productName,
                    PartNumber = item.PartNumber?.Trim(),
                    ProductInformation = item.ProductInformation?.Trim(),
                    SrtID = item.SRTID?.Trim(),
                    ProductStatus = string.IsNullOrEmpty(item.Status) ? "New" : item.Status.Trim()
                };

                _context.MachineParts.Add(newPart);
                await _context.SaveChangesAsync();

                result.Inserted.Add(new MachinePartDto
                {
                    PartName = matchingCat.PartName,
                    OtherNames = matchingCat.OtherNames,
                    PartID = matchingCat.Id,
                    TargetName = targetName,
                    TargetModel = targetModel,
                    ProductName = productName,
                    PartNumber = newPart.PartNumber,
                    ProductInformation = newPart.ProductInformation,
                    ProductID = newPart.Id,
                    SRTID = newPart.SrtID,
                    Status = newPart.ProductStatus
                });
                result.InsertedCount++;
            }
            catch (Exception ex)
            {
                result.Failed.Add(new MachinePartFailedItemDto { ProductName = productName, Error = $"خطای دیتابیس: {ex.Message}" });
            }
        }

        result.Success = true;
        return result;
    }

    private Tuple<string, string>? ExtractMachinery(string productName)
    {
        var keywords = new[] {
            "موتور کوماتسو", "گیربکس زد اف", "گیربکس زداف", "تراک میکسر", "بیل مکانیکی",
            "بيل مکانیکی", "بیل کوماتسو", "بيل کوماتسو", "بیل بکهو", "بيل بکهو",
            "پرکینز", "لودر", "بلدوزر", "غلطک", "غلتک", "گریدر", "دویتس", "کامینز", "کمنز"
        };

        if (string.IsNullOrEmpty(productName)) return null;

        var cleanText = productName.Replace("ي", "ی").Replace("ك", "ک");
        foreach (var keyword in keywords)
        {
            var index = cleanText.IndexOf(keyword);
            if (index != -1)
            {
                var targetName = productName.Substring(0, index).Trim();
                var targetModel = productName.Substring(index).Trim();
                return Tuple.Create(targetName, targetModel);
            }
        }

        return null;
    }
}
