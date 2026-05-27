using SanginPrice.Business.DTOs;

namespace SanginPrice.Business.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginDto login);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<bool> CreateUserAsync(UserDto userDto);
    Task<bool> DeleteUserAsync(string username);
    Task<IEnumerable<RoleDto>> GetRolesAsync();
    Task<bool> UpsertRoleAsync(RoleDto roleDto);
}
