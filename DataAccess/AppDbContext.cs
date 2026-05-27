using Microsoft.EntityFrameworkCore;
using SanginPrice.DataAccess.Entities;

namespace SanginPrice.DataAccess;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<ProductCategory> ProductCategories { get; set; }
    public DbSet<MachinePart> MachineParts { get; set; }
    public DbSet<ProductPrice> ProductPrices { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<DailyView> DailyViews { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure indexes similar to MongoDB indexes
        modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<Role>().HasIndex(r => r.Name).IsUnique();
        
        modelBuilder.Entity<ProductCategory>().HasIndex(p => p.ViewCount);
        
        modelBuilder.Entity<MachinePart>().HasIndex(p => p.PartID);
        modelBuilder.Entity<MachinePart>().HasIndex(p => p.ViewCount);
        
        modelBuilder.Entity<ProductPrice>().HasIndex(p => p.ProductID);
        
        modelBuilder.Entity<Contact>().HasIndex(c => c.FullName);
        
        modelBuilder.Entity<DailyView>().HasIndex(d => new { d.ItemId, d.Date }).IsUnique();

    }
}
