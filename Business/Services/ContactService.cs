using Microsoft.EntityFrameworkCore;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;
using SanginPrice.DataAccess;
using SanginPrice.DataAccess.Entities;

namespace SanginPrice.Business.Services;

public class ContactService : IContactService
{
    private readonly AppDbContext _context;

    public ContactService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ContactDto>> SearchContactsAsync(string? name, string? specialty)
    {
        var query = _context.Contacts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            var clean = name.Trim().ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(clean));
        }

        if (!string.IsNullOrWhiteSpace(specialty))
        {
            var cleanSpec = specialty.Trim().ToLower();
            query = query.Where(c => (c.Specialty != null && c.Specialty.ToLower().Contains(cleanSpec)) 
                                  || (c.Notes != null && c.Notes.ToLower().Contains(cleanSpec)));
        }

        var list = await query.ToListAsync();
        return list.Select(c => new ContactDto
        {
            Id = c.Id,
            _id = c.Id.ToString(),
            FullName = c.FullName,
            Specialty = c.Specialty,
            Landline = c.Landline,
            Phone1 = c.Phone1,
            Phone2 = c.Phone2,
            Address = c.Address,
            Notes = c.Notes
        });
    }

    public async Task<ContactDto?> CreateContactAsync(ContactDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName)) return null;

        var contact = new Contact
        {
            FullName = dto.FullName.Trim(),
            Specialty = dto.Specialty?.Trim(),
            Landline = dto.Landline?.Trim(),
            Phone1 = dto.Phone1?.Trim(),
            Phone2 = dto.Phone2?.Trim(),
            Address = dto.Address?.Trim(),
            Notes = dto.Notes?.Trim()
        };

        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();

        dto.Id = contact.Id;
        dto._id = contact.Id.ToString();
        return dto;
    }

    public async Task<ContactDto?> UpdateContactAsync(int id, ContactDto dto)
    {
        var contact = await _context.Contacts.FindAsync(id);
        if (contact == null) return null;

        contact.FullName = dto.FullName.Trim();
        contact.Specialty = dto.Specialty?.Trim();
        contact.Landline = dto.Landline?.Trim();
        contact.Phone1 = dto.Phone1?.Trim();
        contact.Phone2 = dto.Phone2?.Trim();
        contact.Address = dto.Address?.Trim();
        contact.Notes = dto.Notes?.Trim();

        await _context.SaveChangesAsync();

        dto.Id = contact.Id;
        dto._id = contact.Id.ToString();
        return dto;
    }

    public async Task<bool> DeleteContactAsync(int id)
    {
        var contact = await _context.Contacts.FindAsync(id);
        if (contact == null) return false;

        _context.Contacts.Remove(contact);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<BulkContactResultDto> BulkUploadContactsAsync(List<ContactDto> items)
    {
        var result = new BulkContactResultDto();

        foreach (var item in items)
        {
            var fullName = item.FullName?.Trim() ?? "";
            if (string.IsNullOrEmpty(fullName))
            {
                result.FailedList.Add(new ContactFailedItemDto
                {
                    FullName = "",
                    Specialty = item.Specialty,
                    Landline = item.Landline,
                    Phone1 = item.Phone1,
                    Phone2 = item.Phone2,
                    Address = item.Address,
                    Notes = item.Notes,
                    Reason = "نام و نام خانوادگی الزامی است"
                });
                result.FailedCount++;
                continue;
            }

            var duplicate = await _context.Contacts
                .AnyAsync(c => c.FullName.ToLower() == fullName.ToLower());

            if (duplicate)
            {
                result.FailedList.Add(new ContactFailedItemDto
                {
                    FullName = fullName,
                    Specialty = item.Specialty,
                    Landline = item.Landline,
                    Phone1 = item.Phone1,
                    Phone2 = item.Phone2,
                    Address = item.Address,
                    Notes = item.Notes,
                    Reason = "تکراری (شخصی با این نام قبلاً ثبت شده است)"
                });
                result.FailedCount++;
                continue;
            }

            try
            {
                var contact = new Contact
                {
                    FullName = fullName,
                    Specialty = item.Specialty?.Trim(),
                    Landline = item.Landline?.Trim(),
                    Phone1 = item.Phone1?.Trim(),
                    Phone2 = item.Phone2?.Trim(),
                    Address = item.Address?.Trim(),
                    Notes = item.Notes?.Trim()
                };

                _context.Contacts.Add(contact);
                await _context.SaveChangesAsync();

                var savedDto = new ContactDto
                {
                    Id = contact.Id,
                    _id = contact.Id.ToString(),
                    FullName = contact.FullName,
                    Specialty = contact.Specialty,
                    Landline = contact.Landline,
                    Phone1 = contact.Phone1,
                    Phone2 = contact.Phone2,
                    Address = contact.Address,
                    Notes = contact.Notes
                };

                result.Inserted.Add(savedDto);
                result.InsertedCount++;
            }
            catch (Exception ex)
            {
                result.FailedList.Add(new ContactFailedItemDto
                {
                    FullName = fullName,
                    Specialty = item.Specialty,
                    Landline = item.Landline,
                    Phone1 = item.Phone1,
                    Phone2 = item.Phone2,
                    Address = item.Address,
                    Notes = item.Notes,
                    Reason = $"خطا در فرآیند ذخیره دیتابیس: {ex.Message}"
                });
                result.FailedCount++;
            }
        }

        result.Success = true;
        return result;
    }
}
