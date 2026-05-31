using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/machine-parts")]
public class MachinePartsController : ControllerBase
{
    private readonly IMachinePartService _machService;

    public MachinePartsController(IMachinePartService machService)
    {
        _machService = machService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPartsByQuery([FromQuery] string? category, [FromQuery] string? search)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return BadRequest(new { error = "نام دسته‌بندی (category) الزامی است" });
        }

        // Check if the client accidentally passed the ID as category param
        if (int.TryParse(category, out var partId))
        {
            var partsById = await _machService.GetPartsByCategoryAsync(partId, search);
            return Ok(partsById);
        }

        var parts = await _machService.GetPartsByCategoryNameAsync(category, search);
        return Ok(parts);
    }

    [HttpGet("category/{partId}")]
    public async Task<IActionResult> GetParts(int partId, [FromQuery] string? search)
    {
        var parts = await _machService.GetPartsByCategoryAsync(partId, search);
        return Ok(parts);
    }

    [HttpGet("unlinked")]
    public async Task<IActionResult> GetUnlinked([FromQuery] string? search)
    {
        var parts = await _machService.GetUnlinkedPartsAsync(search);
        return Ok(parts);
    }

    [HttpGet("deleted")]
    public async Task<IActionResult> GetDeleted([FromQuery] string? search)
    {
        var parts = await _machService.GetDeletedPartsAsync(search);
        return Ok(parts);
    }

    [HttpGet("new")]
    public async Task<IActionResult> GetNew([FromQuery] string? search)
    {
        var parts = await _machService.GetNewPartsAsync(search);
        return Ok(parts);
    }

    [HttpGet("all-products")]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var parts = await _machService.GetAllPartsAsync(search);
        return Ok(parts);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MachinePartDto dto)
    {
        var result = await _machService.CreatePartAsync(dto);
        if (result == null)
        {
            return BadRequest(new { error = "شناسه کالا تکراری است یا خطا رخ داد" });
        }
        return Ok(result);
    }

    [HttpPut("{productId}")]
    [HttpPatch("{productId}")]
    public async Task<IActionResult> Update(int productId, [FromBody] MachinePartDto dto)
    {
        var result = await _machService.UpdatePartAsync(productId, dto);
        if (result == null)
        {
            return NotFound(new { error = "کالا پیدا نشد" });
        }
        return Ok(result);
    }

    [HttpDelete("{productId}")]
    public async Task<IActionResult> Delete(int productId)
    {
        var result = await _machService.DeletePartAsync(productId);
        if (!result)
        {
            return NotFound(new { error = "کالا پیدا نشد" });
        }
        return Ok(new { success = true });
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkUpload([FromBody] List<MachinePartDto> items, [FromQuery] string? method)
    {
        var result = await _machService.BulkUploadPartsAsync(items, method == "2");
        return Ok(result);
    }
}
