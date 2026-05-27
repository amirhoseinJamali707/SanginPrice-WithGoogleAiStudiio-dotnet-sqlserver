using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MachinePartsController : ControllerBase
{
    private readonly IMachinePartService _machService;

    public MachinePartsController(IMachinePartService machService)
    {
        _machService = machService;
    }

    [HttpGet("category/{partId}")]
    public async Task<IActionResult> GetParts(int partId, [FromQuery] string? search)
    {
        var parts = await _machService.GetPartsByCategoryAsync(partId, search);
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
