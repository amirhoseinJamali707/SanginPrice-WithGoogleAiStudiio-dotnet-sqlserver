using SanginPrice.Business.DTOs;

namespace SanginPrice.Business.Interfaces;

public interface IMachinePartService
{
    Task<IEnumerable<MachinePartDto>> GetPartsByCategoryAsync(int partId, string? search);
    Task<MachinePartDto?> CreatePartAsync(MachinePartDto dto);
    Task<MachinePartDto?> UpdatePartAsync(int productId, MachinePartDto dto);
    Task<bool> DeletePartAsync(int productId);
    Task<BulkPartUploadResultDto> BulkUploadPartsAsync(List<MachinePartDto> items, bool isMethod2);
}

public class BulkPartUploadResultDto
{
    public bool Success { get; set; }
    public int InsertedCount { get; set; }
    public List<MachinePartDto> Inserted { get; set; } = new();
    public List<MachinePartFailedItemDto> Failed { get; set; } = new();
}

public class MachinePartFailedItemDto : MachinePartDto
{
    public string Error { get; set; } = string.Empty;
}
