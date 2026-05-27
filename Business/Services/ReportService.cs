using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;
using SanginPrice.DataAccess;
using SanginPrice.DataAccess.Entities;

namespace SanginPrice.Business.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ReportSummaryDto> GetPerformanceStatsAsync(string range)
    {
        var users = await _context.Users.ToListAsync();
        var logs = _context.AuditLogs.AsQueryable();

        var sinceDate = DateTime.MinValue;
        if (range == "today")
        {
            sinceDate = DateTime.UtcNow.Date;
        }
        else if (range == "week")
        {
            sinceDate = DateTime.UtcNow.AddDays(-7);
        }
        else if (range == "month")
        {
            sinceDate = DateTime.UtcNow.AddDays(-30);
        }

        if (sinceDate != DateTime.MinValue)
        {
            logs = logs.Where(l => l.CreatedAt >= sinceDate);
        }

        var activityLogs = await logs.ToListAsync();

        var userStats = users.Select(u => {
            var userLogs = activityLogs.Where(l => l.UserId.ToLower() == u.Username.ToLower() || l.UserId.ToLower() == u.UserID.ToLower()).ToList();

            var insertProd = userLogs.Count(l => l.ActionType == "insert_product");
            var updateProd = userLogs.Count(l => l.ActionType == "update_product");
            var insertPrice = userLogs.Count(l => l.ActionType == "insert_price");
            var updatePrice = userLogs.Count(l => l.ActionType == "update_price");

            return new UserStatDto
            {
                UserID = u.UserID,
                Username = u.Username,
                Role = u.Role,
                Email = u.Email,
                Phone = u.Phone,
                Insert_product_count = insertProd,
                Update_product_count = updateProd,
                Insert_price_count = insertPrice,
                Update_price_count = updatePrice,
                Total_activity = insertProd + updateProd + insertPrice + updatePrice
            };
        }).ToList();

        var todayPriceUpdates = await _context.AuditLogs
            .CountAsync(l => l.ActionType == "insert_price" && l.CreatedAt >= DateTime.UtcNow.Date);

        var todayLogs = await _context.AuditLogs
            .Where(l => l.CreatedAt >= DateTime.UtcNow.Date)
            .ToListAsync();

        var activeUser = "بدون فعالیت";
        if (todayLogs.Any())
        {
            var topGroup = todayLogs
                .GroupBy(l => l.UserId)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault();

            if (topGroup != null)
            {
                var profile = users.FirstOrDefault(u => u.Username.ToLower() == topGroup.Key.ToLower() || u.UserID.ToLower() == topGroup.Key.ToLower());
                activeUser = profile?.Username ?? topGroup.Key;
            }
        }

        return new ReportSummaryDto
        {
            UserStats = userStats,
            Summary = new PerformanceSummaryDto
            {
                PriceUpdatesToday = todayPriceUpdates,
                ActiveUserToday = activeUser
            }
        };
    }

    public async Task<IEnumerable<AuditLogDto>> GetUserTimelineLogsAsync(string userId)
    {
        var logs = await _context.AuditLogs
            .Where(l => l.UserId.ToLower() == userId.ToLower())
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .ToListAsync();

        return logs.Select(l => new AuditLogDto
        {
            User_id = l.UserId,
            Action_type = l.ActionType,
            Target_id = l.TargetId,
            Target_type = l.TargetType,
            Description = l.Description,
            Changes = string.IsNullOrEmpty(l.ChangesJson) ? null : JsonSerializer.Deserialize<Dictionary<string, object>>(l.ChangesJson),
            Created_at = l.CreatedAt.ToString("o")
        });
    }

    public async Task<TopViewsReportDto> GetTopViewsReportAsync(string type, string range, int page, int limit)
    {
        var response = new TopViewsReportDto { Page = page };
        int skip = (page - 1) * limit;

        if (type == "product")
        {
            var query = _context.MachineParts.AsQueryable();
            int total = await query.CountAsync();
            response.Total = total;
            response.Pages = (int)Math.Ceiling((double)total / limit);

            IOrderedQueryable<MachinePart> orderedQuery = range switch
            {
                "1month" => query.OrderByDescending(p => p.Views1Month),
                "3months" => query.OrderByDescending(p => p.Views3Months),
                "6months" => query.OrderByDescending(p => p.Views6Months),
                "1year" => query.OrderByDescending(p => p.Views1Year),
                _ => query.OrderByDescending(p => p.ViewCount)
            };

            var list = await orderedQuery.Skip(skip).Take(limit).ToListAsync();
            response.Items = list.Select(p => new TopViewItemDto
            {
                ItemId = p.Id.ToString(),
                Name = p.ProductName,
                Code = p.Id.ToString(),
                Detail = p.PartNumber ?? "",
                Count = range switch
                {
                    "1month" => p.Views1Month,
                    "3months" => p.Views3Months,
                    "6months" => p.Views6Months,
                    "1year" => p.Views1Year,
                    _ => p.ViewCount
                }
            }).ToList();
        }
        else
        {
            var query = _context.ProductCategories.AsQueryable();
            int total = await query.CountAsync();
            response.Total = total;
            response.Pages = (int)Math.Ceiling((double)total / limit);

            IOrderedQueryable<ProductCategory> orderedQuery = range switch
            {
                "1month" => query.OrderByDescending(p => p.Views1Month),
                "3months" => query.OrderByDescending(p => p.Views3Months),
                "6months" => query.OrderByDescending(p => p.Views6Months),
                "1year" => query.OrderByDescending(p => p.Views1Year),
                _ => query.OrderByDescending(p => p.ViewCount)
            };

            var list = await orderedQuery.Skip(skip).Take(limit).ToListAsync();
            response.Items = list.Select(c => new TopViewItemDto
            {
                ItemId = c.Id.ToString(),
                Name = c.PartName,
                Code = c.Id.ToString(),
                Detail = c.OtherNames ?? "",
                Count = range switch
                {
                    "1month" => c.Views1Month,
                    "3months" => c.Views3Months,
                    "6months" => c.Views6Months,
                    "1year" => c.Views1Year,
                    _ => c.ViewCount
                }
            }).ToList();
        }

        return response;
    }
}
