using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using VLXD.Host.Auth;
using VLXD.Modules.Catalog;
using VLXD.Modules.Catalog.Api;
using VLXD.Modules.Sales;
using VLXD.Modules.Sales.Api;
using VLXD.Modules.WMS;
using VLXD.Modules.WMS.Api;
using VLXD.Modules.AI;
using VLXD.Modules.AI.Api;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. Configure Database & Identity
// =========================================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddScoped<TokenService>();

// =========================================================================
// 2. Configure OpenAPI & Swagger
// =========================================================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "VLXD Smart System API", 
        Version = "v1",
        Description = "Enterprise Modular Monolith Backend for VLXD Smart System"
    });
    
    // Add Security Definition for JWT Bearer
    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = JwtBearerDefaults.AuthenticationScheme
                }
            },
            Array.Empty<string>()
        }
    });
});

// =========================================================================
// 3. Configure CORS
// =========================================================================
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// =========================================================================
// 4. Configure MediatR (In-process Event Bus)
// =========================================================================
builder.Services.AddMediatR(cfg => 
{
    cfg.RegisterServicesFromAssemblies(
        typeof(Program).Assembly,
        typeof(CatalogModule).Assembly,
        typeof(SalesModule).Assembly,
        typeof(WmsModule).Assembly,
        typeof(AiModule).Assembly
    );
});

// =========================================================================
// 5. Register Modular Monolith Modules
// =========================================================================
builder.Services.AddCatalogModule(builder.Configuration);
builder.Services.AddSalesModule(builder.Configuration);
builder.Services.AddWmsModule(builder.Configuration);
builder.Services.AddAiModule(builder.Configuration);

// =========================================================================
// 6. Configure Authentication & Authorization
// =========================================================================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "VLXD.Host",
        ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "VLXD.Clients",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            builder.Configuration["JwtSettings:SecretKey"] ?? "VlxdSmartSystem2024SuperSecretKeyThatIsLongEnough!"))
    };
});

builder.Services.AddAuthorization();

// =========================================================================
// 7. Build the Application
// =========================================================================
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VLXD Smart System API V1");
    });
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// =========================================================================
// 8. Map Endpoints
// =========================================================================
app.MapAuthEndpoints();
app.MapCatalogEndpoints();
app.MapSalesEndpoints();
app.MapWmsEndpoints();
app.MapAiEndpoints();

app.MapGet("/", () => "VLXD Smart System Backend Host is running.");

// =========================================================================
// 9. Seed Database
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await VLXD.Host.Data.DbSeeder.SeedAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<Microsoft.Extensions.Logging.ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.Run();
