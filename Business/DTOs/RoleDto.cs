namespace SanginPrice.Business.DTOs;

public class RoleDto
{
    public string Name { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
}
