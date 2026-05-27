using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string range = "all")
    {
        var stats = await _reportService.GetPerformanceStatsAsync(range);
        return Ok(stats);
    }

    [HttpGet("timeline/{userId}")]
    public async Task<IActionResult> GetTimeline(string userId)
    {
        var logs = await _reportService.GetUserTimelineLogsAsync(userId);
        return Ok(logs);
    }

    [HttpGet("top-views")]
    public async Task<IActionResult> GetTopViews([FromQuery] string type = "part", [FromQuery] string range = "3months", [FromQuery] int page = 1, [FromQuery] int limit = 30)
    {
        var result = await _reportService.GetTopViewsReportAsync(type, range, page, limit);
        return Ok(result);
    }
}
