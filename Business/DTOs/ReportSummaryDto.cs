namespace SanginPrice.Business.DTOs;

public class ReportSummaryDto
{
    public List<UserStatDto> UserStats { get; set; } = new();
    public PerformanceSummaryDto Summary { get; set; } = new();
}

public class PerformanceSummaryDto
{
    public int PriceUpdatesToday { get; set; }
    public string ActiveUserToday { get; set; } = "بدون فعالیت";
}

public class UserStatDto
{
    public string UserID { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int Insert_product_count { get; set; }
    public int Update_product_count { get; set; }
    public int Insert_price_count { get; set; }
    public int Update_price_count { get; set; }
    public int Total_activity { get; set; }
}

public class TopViewsReportDto
{
    public List<TopViewItemDto> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Pages { get; set; }
}

public class TopViewItemDto
{
    public string ItemId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public int Count { get; set; }
}
