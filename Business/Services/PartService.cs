using Microsoft.EntityFrameworkCore;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;
using SanginPrice.DataAccess;
using SanginPrice.DataAccess.Entities;

namespace SanginPrice.Business.Services;

public class PartService : IPartService
{
    private readonly AppDbContext _context;

    public PartService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductCategoryDto>> SearchCategoriesAsync(string? search1, string? search2)
    {
        var query = _context.ProductCategories.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search1))
        {
            var term1 = search1.Trim().ToLower();
            query = query.Where(c => c.PartName.ToLower().Contains(term1) 
                                  || (c.OtherNames != null && c.OtherNames.ToLower().Contains(term1)));
        }

        if (!string.IsNullOrWhiteSpace(search2))
        {
            var term2 = search2.Trim().ToLower();
            query = query.Where(c => c.PartName.ToLower().Contains(term2) 
                                  || (c.OtherNames != null && c.OtherNames.ToLower().Contains(term2)));
        }

        var list = await query.ToListAsync();
        return list.Select(c => new ProductCategoryDto
        {
            Id = c.Id,
            PartName = c.PartName,
            OtherNames = c.OtherNames,
            PartCollection = c.PartCollection
        });
    }

    public async Task<ProductCategoryDto?> CreateCategoryAsync(ProductCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PartName)) return null;

        var cleanName = dto.PartName.Trim();
        var exists = await _context.ProductCategories
            .AnyAsync(c => c.PartName.ToLower() == cleanName.ToLower());

        if (exists) return null;

        var cat = new ProductCategory
        {
            PartName = cleanName,
            OtherNames = dto.OtherNames?.Trim(),
            PartCollection = dto.PartCollection?.Trim()
        };

        _context.ProductCategories.Add(cat);
        await _context.SaveChangesAsync();

        dto.Id = cat.Id;
        return dto;
    }

    public async Task<ProductCategoryDto?> UpdateCategoryAsync(int partId, ProductCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PartName)) return null;

        var cat = await _context.ProductCategories.FirstOrDefaultAsync(c => c.Id == partId);
        if (cat == null) return null;

        var cleanName = dto.PartName.Trim();
        var duplicate = await _context.ProductCategories
            .AnyAsync(c => c.Id != partId && c.PartName.ToLower() == cleanName.ToLower());

        if (duplicate) return null;

        cat.PartName = cleanName;
        cat.OtherNames = dto.OtherNames?.Trim();
        cat.PartCollection = dto.PartCollection?.Trim();

        await _context.SaveChangesAsync();
        dto.Id = partId;
        return dto;
    }

    public async Task<bool> DeleteCategoryAsync(int partId)
    {
        var cat = await _context.ProductCategories.FirstOrDefaultAsync(c => c.Id == partId);
        if (cat == null) return false;

        _context.ProductCategories.Remove(cat);

        // Delete associated products and prices
        var products = await _context.MachineParts.Where(p => p.PartID == partId).ToListAsync();
        _context.MachineParts.RemoveRange(products);

        var productIds = products.Select(p => p.Id).ToList();
        var prices = await _context.ProductPrices.Where(p => productIds.Contains(p.ProductID)).ToListAsync();
        _context.ProductPrices.RemoveRange(prices);

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<BulkPartResponseDto> BulkUploadCategoriesAsync(List<ProductCategoryDto> items)
    {
        var response = new BulkPartResponseDto();

        foreach (var item in items)
        {
            var partName = item.PartName?.Trim() ?? "";
            if (string.IsNullOrEmpty(partName))
            {
                response.FailedList.Add(new PartFailedItemDto
                {
                    PartName = "",
                    OtherNames = item.OtherNames,
                    PartCollection = item.PartCollection,
                    Reason = "نام معیار قطعه خالی یا نامعتبر است"
                });
                continue;
            }

            var duplicate = await _context.ProductCategories
                .AnyAsync(c => c.PartName.ToLower() == partName.ToLower());

            if (duplicate)
            {
                response.Skipped.Add(partName);
                response.SkippedCount++;
                response.FailedList.Add(new PartFailedItemDto
                {
                    PartName = partName,
                    OtherNames = item.OtherNames,
                    PartCollection = item.PartCollection,
                    Reason = "تکراری (این نام معیار قطعه از قبل ثبت شده است)"
                });
                continue;
            }

            try
            {
                var normalizedOthers = "";
                if (!string.IsNullOrEmpty(item.OtherNames))
                {
                    normalizedOthers = string.Join(", ", item.OtherNames
                        .Split(new[] { '-', '_', ',', '،' })
                        .Select(s => s.Trim())
                        .Where(s => !string.IsNullOrEmpty(s)));
                }

                var cat = new ProductCategory
                {
                    PartName = partName,
                    OtherNames = normalizedOthers,
                    PartCollection = item.PartCollection?.Trim()
                };

                _context.ProductCategories.Add(cat);
                await _context.SaveChangesAsync();

                var savedDto = new ProductCategoryDto
                {
                    Id = cat.Id,
                    PartName = partName,
                    OtherNames = normalizedOthers,
                    PartCollection = cat.PartCollection
                };

                response.Inserted.Add(savedDto);
                response.InsertedCount++;
            }
            catch (Exception ex)
            {
                response.FailedList.Add(new PartFailedItemDto
                {
                    PartName = partName,
                    OtherNames = item.OtherNames,
                    PartCollection = item.PartCollection,
                    Reason = $"خطا در دیتابیس: {ex.Message}"
                });
            }
        }

        response.Success = true;
        return response;
    }
}
