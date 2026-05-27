using SanginPrice.Business.DTOs;

namespace SanginPrice.Business.Interfaces;

public interface IReportService
{
    Task<ReportSummaryDto> GetPerformanceStatsAsync(string range);
    Task<IEnumerable<AuditLogDto>> GetUserTimelineLogsAsync(string userId);
    Task<TopViewsReportDto> GetTopViewsReportAsync(string type, string range, int page, int limit);
}
