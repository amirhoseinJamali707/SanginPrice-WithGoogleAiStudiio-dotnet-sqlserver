using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;
using SanginPrice.DataAccess;
using SanginPrice.DataAccess.Entities;

namespace SanginPrice.Business.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;

    public AuthService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginDto login)
    {
        var username = login.Username.Trim().ToLower();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username);

        if (user == null || user.Password != login.Password)
        {
            return new LoginResponseDto { Success = false, Message = "نام کاربری یا رمز عبور اشتباه است" };
        }

        var permissions = new List<string>();
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == user.Role.ToLower());
        if (role != null)
        {
            try
            {
                permissions = JsonSerializer.Deserialize<List<string>>(role.PermissionsJson) ?? new List<string>();
            }
            catch {}
        }

        if (user.Role.ToLower() == "admin")
        {
            permissions = new List<string> { "manage_categories", "manage_parts", "manage_quotes", "manage_users" };
        }

        return new LoginResponseDto
        {
            Success = true,
            Token = $"token-user-{user.Username}",
            Username = user.Username,
            Role = user.Role,
            Permissions = permissions
        };
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _context.Users.ToListAsync();
        return users.Select(u => new UserDto
        {
            Username = u.Username,
            Password = u.Password,
            Role = u.Role,
            UserID = u.UserID,
            Email = u.Email,
            Phone = u.Phone
        });
    }

    public async Task<bool> CreateUserAsync(UserDto dto)
    {
        var cleanUsername = dto.Username.Trim();
        var exists = await _context.Users.AnyAsync(u => u.Username.ToLower() == cleanUsername.ToLower());
        if (exists) return false;

        var rand = new Random();
        var userId = $"usr-{rand.Next(100000, 999999)}";
        var email = !string.IsNullOrEmpty(dto.Email) ? dto.Email : $"{cleanUsername.ToLower()}@sanginprice.ir";
        var phone = !string.IsNullOrEmpty(dto.Phone) ? dto.Phone : $"0912{rand.Next(1000000, 9999999)}";

        var user = new User
        {
            Username = cleanUsername,
            Password = dto.Password,
            Role = dto.Role,
            UserID = userId,
            Email = email,
            Phone = phone
        };

        _context.Users.Add(user);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteUserAsync(string username)
    {
        if (username.ToLower() == "admin") return false;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        if (user == null) return false;

        _context.Users.Remove(user);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<IEnumerable<RoleDto>> GetRolesAsync()
    {
        var roles = await _context.Roles.ToListAsync();
        return roles.Select(r => new RoleDto
        {
            Name = r.Name,
            Permissions = JsonSerializer.Deserialize<List<string>>(r.PermissionsJson) ?? new List<string>()
        });
    }

    public async Task<bool> UpsertRoleAsync(RoleDto dto)
    {
        var name = dto.Name.Trim().ToLower();
        var json = JsonSerializer.Serialize(dto.Permissions);

        var existing = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == name);
        if (existing != null)
        {
            existing.PermissionsJson = json;
        }
        else
        {
            _context.Roles.Add(new Role { Name = name, PermissionsJson = json });
        }

        return await _context.SaveChangesAsync() > 0;
    }
}
