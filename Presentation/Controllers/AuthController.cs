using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto login)
    {
        var result = await _authService.LoginAsync(login);
        if (!result.Success)
        {
            return Unauthorized(new { success = false, message = result.Message });
        }
        return Ok(result);
    }
}
