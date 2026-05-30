using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using SanginPrice.Business.Interfaces;
using SanginPrice.Business.Services;
using SanginPrice.DataAccess;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure SQL Server connection
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Registered Application Core Interfaces and Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPartService, PartService>();
builder.Services.AddScoped<IMachinePartService, MachinePartService>();
builder.Services.AddScoped<IPriceService, PriceService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IReportService, ReportService>();

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    
    // Start Vite Dev Server in the background automatically if not already running
    StartViteDevServer();
    
    // Proxy fallback non-API requests to the Vite dev server
    app.Use(async (context, next) =>
    {
        var path = context.Request.Path.Value ?? "";
        if (path.StartsWith("/api") || 
            string.Equals(context.Request.Method, "CONNECT", StringComparison.OrdinalIgnoreCase) ||
            context.WebSockets.IsWebSocketRequest)
        {
            await next();
            return;
        }

        using var httpClient = new HttpClient();
        var targetUrl = $"http://localhost:5173{context.Request.Path}{context.Request.QueryString}";
        
        try
        {
            var requestMessage = new HttpRequestMessage();
            requestMessage.Method = new HttpMethod(context.Request.Method);
            requestMessage.RequestUri = new Uri(targetUrl);
            
            foreach (var header in context.Request.Headers)
            {
                if (!header.Key.StartsWith("Host", StringComparison.OrdinalIgnoreCase))
                {
                    requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                }
            }
            
            if (context.Request.ContentLength > 0 || context.Request.ContentType != null)
            {
                var streamContent = new StreamContent(context.Request.Body);
                requestMessage.Content = streamContent;
                if (context.Request.ContentType != null)
                {
                    streamContent.Headers.ContentType = System.Net.Http.Headers.MediaTypeHeaderValue.Parse(context.Request.ContentType);
                }
            }

            var responseMessage = await httpClient.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);
            context.Response.StatusCode = (int)responseMessage.StatusCode;
            
            foreach (var header in responseMessage.Headers)
            {
                context.Response.Headers[header.Key] = header.Value.ToArray();
            }
            foreach (var header in responseMessage.Content.Headers)
            {
                context.Response.Headers[header.Key] = header.Value.ToArray();
            }
            
            context.Response.Headers.Remove("transfer-encoding");
            
            await responseMessage.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
        }
        catch (Exception)
        {
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.WriteAsync("<h2>در حال راه‌اندازی فرانت‌اند (Vite)... لطفا چند ثانیه دیگر صفحه را رفرش کنید.</h2><script>setTimeout(() => { location.reload(); }, 2000);</script>");
        }
    });
}
else
{
    // Serve production built files
    var distPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "dist"));
    if (!Directory.Exists(distPath))
    {
        distPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "dist"));
    }

    if (Directory.Exists(distPath))
    {
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(distPath),
            RequestPath = ""
        });
        
        app.MapFallbackToFile("index.html", new StaticFileOptions
        {
            FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(distPath)
        });
    }
    else
    {
        app.UseStaticFiles();
    }
}

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        // Ensure the database itself exists
        context.Database.EnsureCreated();

        Console.WriteLine("Starting safe idempotent database schema verification...");

        // 1. Safe creation of Users Table
        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID(N'[dbo].[Users]', 'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[Users] (
                    [Id] INT IDENTITY(1,1) NOT NULL,
                    [Username] NVARCHAR(100) NOT NULL,
                    [Password] NVARCHAR(255) NOT NULL,
                    [Role] NVARCHAR(50) NOT NULL,
                    [UserID] NVARCHAR(100) NOT NULL,
                    [Email] NVARCHAR(150) NULL DEFAULT '',
                    [Phone] NVARCHAR(50) NULL DEFAULT '',
                    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
                CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Username] ON [dbo].[Users] ([Username] ASC);
            END
        ");

        // 2. Safe creation of Roles Table
        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID(N'[dbo].[Roles]', 'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[Roles] (
                    [Id] INT IDENTITY(1,1) NOT NULL,
                    [Name] NVARCHAR(255) NOT NULL,
                    [PermissionsJson] NVARCHAR(MAX) NULL,
                    CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
                CREATE UNIQUE NONCLUSTERED INDEX [IX_Roles_Name] ON [dbo].[Roles] ([Name] ASC);
            END
        ");

        // 3. Safe creation of part_name (ProductCategories) Table
        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID(N'[dbo].[part_name]', 'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[part_name] (
                    [Id] INT IDENTITY(1,1) NOT NULL,
                    [PartName] NVARCHAR(255) NOT NULL,
                    [OtherNames] NVARCHAR(MAX) NULL,
                    [PartCollection] NVARCHAR(255) NULL,
                    [ViewCount] INT NOT NULL DEFAULT 0,
                    [Views1Month] INT NOT NULL DEFAULT 0,
                    [Views3Months] INT NOT NULL DEFAULT 0,
                    [Views6Months] INT NOT NULL DEFAULT 0,
                    [Views1Year] INT NOT NULL DEFAULT 0,
                    CONSTRAINT [PK_part_name] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
                CREATE NONCLUSTERED INDEX [IX_part_name_ViewCount] ON [dbo].[part_name] ([ViewCount] ASC);
            END
        ");

        // 4. Safe creation of product_name (MachineParts) Table
        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID(N'[dbo].[product_name]', 'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[product_name] (
                    [Id] INT IDENTITY(1,1) NOT NULL,
                    [PartID] INT NOT NULL,
                    [TargetName] NVARCHAR(255) NULL,
                    [TargetModel] NVARCHAR(255) NULL,
                    [ProductName] NVARCHAR(255) NOT NULL,
                    [PartNumber] NVARCHAR(100) NULL,
                    [ProductInformation] NVARCHAR(MAX) NULL,
                    [SrtID] NVARCHAR(100) NULL,
                    [ProductStatus] NVARCHAR(50) NOT NULL DEFAULT 'New',
                    [ViewCount] INT NOT NULL DEFAULT 0,
                    [Views1Month] INT NOT NULL DEFAULT 0,
                    [Views3Months] INT NOT NULL DEFAULT 0,
                    [Views6Months] INT NOT NULL DEFAULT 0,
                    [Views1Year] INT NOT NULL DEFAULT 0,
                    CONSTRAINT [PK_product_name] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
                CREATE NONCLUSTERED INDEX [IX_product_name_PartID] ON [dbo].[product_name] ([PartID] ASC);
                CREATE NONCLUSTERED INDEX [IX_product_name_ViewCount] ON [dbo].[product_name] ([ViewCount] ASC);
            END
        ");

        // 5. Safe creation of product_prices Table
        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID(N'[dbo].[product_prices]', 'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[product_prices] (
                    [Id] INT IDENTITY(1,1) NOT NULL,
                    [ProductID] INT NOT NULL,
                    [PriceStatus] NVARCHAR(100) NULL,
                    [LastPriceUpdateDate] NVARCHAR(100) NULL,
                    [Price] NVARCHAR(100) NOT NULL,
                    [SupplierName] NVARCHAR(255) NULL,
                    [Material] NVARCHAR(255) NULL,
                    [PriceRecorder] NVARCHAR(100) NULL,
                    [DailyDollarRate] NVARCHAR(100) NOT NULL,
                    [PriceValidityDays] INT NOT NULL DEFAULT 7,
                    [EstimatedPrice] NVARCHAR(MAX) NULL,
                    [SRTPriceID] NVARCHAR(100) NULL,
                    [CRMID] NVARCHAR(100) NULL,
                    [ShelfNumber] NVARCHAR(100) NULL,
                    CONSTRAINT [PK_product_prices] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
                CREATE NONCLUSTERED INDEX [IX_product_prices_ProductID] ON [dbo].[product_prices] ([ProductID] ASC);
            END
        ");

        // 6. Safe creation of Contacts Table
        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID(N'[dbo].[Contacts]', 'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[Contacts] (
                    [Id] INT IDENTITY(1,1) NOT NULL,
                    [FullName] NVARCHAR(255) NOT NULL,
                    [Specialty] NVARCHAR(255) NULL,
                    [Landline] NVARCHAR(50) NULL,
                    [Phone1] NVARCHAR(50) NULL,
                    [Phone2] NVARCHAR(50) NULL,
                    [Address] NVARCHAR(500) NULL,
                    [Notes] NVARCHAR(MAX) NULL,
                    CONSTRAINT [PK_Contacts] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
                CREATE NONCLUSTERED INDEX [IX_Contacts_FullName] ON [dbo].[Contacts] ([FullName] ASC);
            END
        ");

        // 7. Safe creation of AuditLogs Table
        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID(N'[dbo].[AuditLogs]', 'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[AuditLogs] (
                    [Id] INT IDENTITY(1,1) NOT NULL,
                    [UserId] NVARCHAR(100) NOT NULL,
                    [ActionType] NVARCHAR(50) NOT NULL,
                    [TargetId] NVARCHAR(100) NOT NULL,
                    [TargetType] NVARCHAR(50) NOT NULL,
                    [Description] NVARCHAR(MAX) NULL,
                    [ChangesJson] NVARCHAR(MAX) NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    CONSTRAINT [PK_AuditLogs] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
            END
        ");

        // 8. Safe creation of DailyViews Table
        context.Database.ExecuteSqlRaw(@"
            IF OBJECT_ID(N'[dbo].[DailyViews]', 'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[DailyViews] (
                    [Id] INT IDENTITY(1,1) NOT NULL,
                    [ItemId] NVARCHAR(100) NOT NULL,
                    [TargetId] NVARCHAR(100) NULL,
                    [Date] NVARCHAR(10) NOT NULL,
                    [Count] INT NOT NULL DEFAULT 0,
                    CONSTRAINT [PK_DailyViews] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DailyViews_ItemId_Date' AND object_id = OBJECT_ID('[dbo].[DailyViews]'))
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX [IX_DailyViews_ItemId_Date] ON [dbo].[DailyViews] ([ItemId], [Date]);
                END
            END
        ");

        // 9. Safe ensuring of all columns across previously created tables
        context.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[product_prices]') AND name = 'Material')
                ALTER TABLE [dbo].[product_prices] ADD [Material] NVARCHAR(255) NULL;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[part_name]') AND name = 'ViewCount')
                ALTER TABLE [dbo].[part_name] ADD [ViewCount] INT NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[part_name]') AND name = 'Views1Month')
                ALTER TABLE [dbo].[part_name] ADD [Views1Month] INT NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[part_name]') AND name = 'Views3Months')
                ALTER TABLE [dbo].[part_name] ADD [Views3Months] INT NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[part_name]') AND name = 'Views6Months')
                ALTER TABLE [dbo].[part_name] ADD [Views6Months] INT NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[part_name]') AND name = 'Views1Year')
                ALTER TABLE [dbo].[part_name] ADD [Views1Year] INT NOT NULL DEFAULT 0;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[product_name]') AND name = 'ViewCount')
                ALTER TABLE [dbo].[product_name] ADD [ViewCount] INT NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[product_name]') AND name = 'Views1Month')
                ALTER TABLE [dbo].[product_name] ADD [Views1Month] INT NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[product_name]') AND name = 'Views3Months')
                ALTER TABLE [dbo].[product_name] ADD [Views3Months] INT NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[product_name]') AND name = 'Views6Months')
                ALTER TABLE [dbo].[product_name] ADD [Views6Months] INT NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[product_name]') AND name = 'Views1Year')
                ALTER TABLE [dbo].[product_name] ADD [Views1Year] INT NOT NULL DEFAULT 0;
        ");

        Console.WriteLine("Idempotent database schema verification & migration completed successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database Creation/Migration Exception: {ex.Message}");
    }
}

app.Run();

// Helper method to automatically start the React/Vite development server
static void StartViteDevServer()
{
    try
    {
        string currentDir = AppDomain.CurrentDomain.BaseDirectory;
        string? rootDir = null;
        while (!string.IsNullOrEmpty(currentDir))
        {
            if (File.Exists(Path.Combine(currentDir, "package.json")))
            {
                rootDir = currentDir;
                break;
            }
            currentDir = Path.GetDirectoryName(currentDir) ?? "";
        }

        if (rootDir == null)
        {
            var projDir = Directory.GetCurrentDirectory();
            if (File.Exists(Path.Combine(projDir, "package.json")))
            {
                rootDir = projDir;
            }
            else if (File.Exists(Path.Combine(projDir, "..", "package.json")))
            {
                rootDir = Path.GetFullPath(Path.Combine(projDir, ".."));
            }
        }

        if (rootDir != null)
        {
            using (var tcpClient = new System.Net.Sockets.TcpClient())
            {
                var result = tcpClient.BeginConnect("127.0.0.1", 5173, null, null);
                var success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(200));
                if (success)
                {
                    Console.WriteLine("Vite dev server is already running on port 5173.");
                    return;
                }
            }

            Console.WriteLine($"Starting Vite dev server in: {rootDir}");
            var isWindows = System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows);
            var processInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = isWindows ? "cmd.exe" : "npm",
                Arguments = isWindows ? "/k npm run dev-vite" : "run dev-vite",
                WorkingDirectory = rootDir,
                UseShellExecute = isWindows,
                CreateNoWindow = false
            };
            
            System.Diagnostics.Process.Start(processInfo);
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Failed to automatically start Vite dev server: {ex.Message}");
    }
}
