using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly IAuthService _authService;

    public RolesController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _authService.GetRolesAsync();
        return Ok(roles);
    }

    [HttpPost]
    public async Task<IActionResult> UpsertRole([FromBody] RoleDto dto)
    {
        var result = await _authService.UpsertRoleAsync(dto);
        return Ok(new { success = result });
    }
}
