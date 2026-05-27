using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IPartService _partService;

    public CategoriesController(IPartService partService)
    {
        _partService = partService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? search1, [FromQuery] string? search2)
    {
        var categories = await _partService.SearchCategoriesAsync(search1, search2);
        return Ok(categories);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductCategoryDto dto)
    {
        var result = await _partService.CreateCategoryAsync(dto);
        if (result == null)
        {
            return BadRequest(new { error = "قطعه‌ای با این نام قبلا ثبت شده است یا خالی است" });
        }
        return StatusCode(201, result);
    }

    [HttpPatch("{partId}")]
    public async Task<IActionResult> Update(int partId, [FromBody] ProductCategoryDto dto)
    {
        var result = await _partService.UpdateCategoryAsync(partId, dto);
        if (result == null)
        {
            return BadRequest(new { error = "نام قطعه تکراری است یا پیدا نشد" });
        }
        return Ok(result);
    }

    [HttpDelete("{partId}")]
    public async Task<IActionResult> Delete(int partId)
    {
        var result = await _partService.DeleteCategoryAsync(partId);
        if (!result)
        {
            return NotFound(new { error = "قطعه پیدا نشد" });
        }
        return Ok(new { success = true });
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkUpload([FromBody] List<ProductCategoryDto> items)
    {
        var result = await _partService.BulkUploadCategoriesAsync(items);
        return Ok(result);
    }
}
