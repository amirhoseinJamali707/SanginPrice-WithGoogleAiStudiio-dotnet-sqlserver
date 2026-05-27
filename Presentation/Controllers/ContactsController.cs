using Microsoft.AspNetCore.Mvc;
using SanginPrice.Business.DTOs;
using SanginPrice.Business.Interfaces;

namespace SanginPrice.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactsController : ControllerBase
{
    private readonly IContactService _contactService;

    public ContactsController(IContactService contactService)
    {
        _contactService = contactService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? searchName, [FromQuery] string? searchSpecialty)
    {
        var list = await _contactService.SearchContactsAsync(searchName, searchSpecialty);
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContactDto contact)
    {
        var result = await _contactService.CreateContactAsync(contact);
        if (result == null)
        {
            return BadRequest(new { error = "نام و نام خانوادگی الزامی است" });
        }
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ContactDto contact)
    {
        var result = await _contactService.UpdateContactAsync(id, contact);
        if (result == null)
        {
            return NotFound(new { error = "شخص مورد نظر یافت نشد" });
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _contactService.DeleteContactAsync(id);
        if (!result)
        {
            return NotFound(new { error = "شخص مورد نظر یافت نشد" });
        }
        return Ok(new { success = true });
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkUpload([FromBody] List<ContactDto> items)
    {
        var result = await _contactService.BulkUploadContactsAsync(items);
        return Ok(result);
    }
}
