using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IAuthService _authService;

    public UsersController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _authService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UserDto user)
    {
        if (string.IsNullOrEmpty(user.Username) || string.IsNullOrEmpty(user.Password) || string.IsNullOrEmpty(user.Role))
        {
            return BadRequest(new { error = "همه فیلدها الزامی هستند" });
        }

        var result = await _authService.CreateUserAsync(user);
        if (!result)
        {
            return BadRequest(new { error = "کاربری با این نام کاربری قبلا ثبت شده است" });
        }

        return Ok(new { success = true });
    }

    [HttpDelete("{username}")]
    public async Task<IActionResult> Delete(string username)
    {
        var result = await _authService.DeleteUserAsync(username);
        if (!result)
        {
            return BadRequest(new { error = "کاربر اصلی سیستم قابل حذف نیست یا پیدا نشد" });
        }
        return Ok(new { success = true });
    }
}
