using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using SanginPrice.Business.Interfaces;
using SanginPrice.Business.Services;
using SanginPrice.DataAccess;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });

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
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        // First try standard EnsureCreated
        context.Database.EnsureCreated();

        // EF Core EnsureCreated has a limitation: if the database already exists (even if completely empty with 0 tables),
        // it skips table creation. We use RelationalDatabaseCreator to explicitly force schema construction on existed databases.
        var databaseCreator = context.Database.GetService<IDatabaseCreator>() as RelationalDatabaseCreator;
        if (databaseCreator != null && databaseCreator.Exists())
        {
            try
            {
                databaseCreator.CreateTables();
                Console.WriteLine("Database tables verified or successfully created.");
            }
            catch (Exception)
            {
                // This exception occurs if tables already exist, which is expected and completely fine.
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database Creation Warning: {ex.Message}");
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
