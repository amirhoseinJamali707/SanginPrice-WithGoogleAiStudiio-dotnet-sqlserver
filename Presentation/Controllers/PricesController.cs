using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/quotes")]
public class PricesController : ControllerBase
{
    private readonly IPriceService _priceService;

    public PricesController(IPriceService priceService)
    {
        _priceService = priceService;
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetPrices(int productId, [FromHeader] string? username)
    {
        var activeUser = username ?? "Admin";
        var prices = await _priceService.GetPricesByProductAsync(productId, activeUser);
        return Ok(prices);
    }

    [HttpPost]
    public async Task<IActionResult> AddPrice([FromBody] ProductPriceDto dto, [FromHeader] string? username)
    {
        var activeUser = username ?? "Admin";
        var result = await _priceService.AddPriceAsync(dto, activeUser);
        if (result == null)
        {
            return BadRequest(new { error = "خطا در ثبت قیمت جدید" });
        }
        return Ok(result);
    }

    [HttpPut("{priceId}")]
    public async Task<IActionResult> UpdatePrice(int priceId, [FromBody] ProductPriceDto dto, [FromHeader] string? username)
    {
        var activeUser = username ?? "Admin";
        var result = await _priceService.UpdatePriceAsync(priceId, dto, activeUser);
        if (result == null)
        {
            return NotFound(new { error = "قیمت مورد نظر یافت نشد" });
        }
        return Ok(result);
    }

    [HttpDelete("{priceId}")]
    public async Task<IActionResult> DeletePrice(int priceId, [FromHeader] string? username)
    {
        var activeUser = username ?? "Admin";
        var result = await _priceService.DeletePriceAsync(priceId, activeUser);
        if (!result)
        {
            return NotFound(new { error = "قیمت مورد نظر یافت نشد" });
        }
        return Ok(new { success = true });
    }

    [HttpPost("{priceId}/invalidate")]
    public async Task<IActionResult> InvalidatePrice(int priceId, [FromHeader] string? username)
    {
        var activeUser = username ?? "Admin";
        var result = await _priceService.MarkPriceAsInvalidAsync(priceId, activeUser);
        if (!result)
        {
            return NotFound(new { error = "قیمت مورد نظر یافت نشد" });
        }
        return Ok(new { success = true });
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchPrices(
        [FromQuery] string search, 
        [FromQuery] string searchIn = "productName", 
        [FromQuery] string fromDate = "", 
        [FromQuery] string toDate = "", 
        [FromQuery] string supplierName = "", 
        [FromQuery] string fromUser = "", 
        [FromQuery] int validityStatus = 0)
    {
        var result = await _priceService.GeneralSearchPricesAsync(search, searchIn, fromDate, toDate, supplierName, fromUser, validityStatus);
        return Ok(result);
    }
}
