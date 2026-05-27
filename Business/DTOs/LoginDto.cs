using System.ComponentModel.DataAnnotations;

namespace SanginPrice.Business.DTOs;

public class LoginDto
{
    [Required(ErrorMessage = "نام کاربری الزامی است")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "رمز عبور الزامی است")]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public bool Success { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
