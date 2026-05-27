using SanginPrice.Business.DTOs;

namespace SanginPrice.Business.Interfaces;

public interface IContactService
{
    Task<IEnumerable<ContactDto>> SearchContactsAsync(string? name, string? specialty);
    Task<ContactDto?> CreateContactAsync(ContactDto contact);
    Task<ContactDto?> UpdateContactAsync(int id, ContactDto contact);
    Task<bool> DeleteContactAsync(int id);
    Task<BulkContactResultDto> BulkUploadContactsAsync(List<ContactDto> items);
}
