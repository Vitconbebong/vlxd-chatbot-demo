using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.Sales.Infrastructure;
using VLXD.SharedKernel.Domain.Events;

namespace VLXD.Host.Auth;

/// <summary>
/// Exposes authentication and registration Minimal API endpoints.
/// </summary>
public static class AuthEndpoints
{
    #region Methods

    /// <summary>
    /// Maps authentication endpoints to the main routing table.
    /// </summary>
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/login", LoginAsync);
        group.MapPost("/register", RegisterAsync);

        group.MapGet("/accounts", GetAccountsAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));
        group.MapPost("/accounts", CreateAccountAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));
        group.MapPut("/accounts/{id}", UpdateAccountAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        return endpoints;
    }

    #region Endpoint Handlers

    private static async Task<IResult> GetAccountsAsync(
        [FromServices] UserManager<ApplicationUser> userManager,
        [FromServices] SalesDbContext salesDb)
    {
        var users = await userManager.Users.ToListAsync();
        var resultList = new List<AccountResponse>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            string address = string.Empty;
            if (roles.Contains("Customer", StringComparer.OrdinalIgnoreCase))
            {
                if (Guid.TryParse(user.Id, out var parsedGuid))
                {
                    var customer = await salesDb.Customers.FirstOrDefaultAsync(c => c.Id == parsedGuid);
                    address = customer?.Address ?? string.Empty;
                }
            }

            resultList.Add(new AccountResponse(
                Id: user.Id,
                Email: user.Email ?? string.Empty,
                FullName: user.FullName,
                Roles: roles.ToList(),
                CustomerTier: user.CustomerTier,
                PhoneNumber: user.PhoneNumber,
                Address: address
            ));
        }

        return Results.Ok(resultList);
    }

    private static async Task<IResult> CreateAccountAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IMediator mediator,
        [FromBody] CreateAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.BadRequest(new { Message = "Email and Password are required." });
        }

        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return Results.Conflict(new { Message = "Email already registered." });
        }

        var customerId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = customerId.ToString(),
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.Phone,
            CustomerTier = string.IsNullOrWhiteSpace(request.CustomerTier) ? "Retail" : request.CustomerTier
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return Results.BadRequest(result.Errors);
        }

        var role = string.IsNullOrWhiteSpace(request.Role) ? "Customer" : request.Role;
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }

        await userManager.AddToRoleAsync(user, role);

        if (role.Equals("Customer", StringComparison.OrdinalIgnoreCase))
        {
            await mediator.Publish(new CustomerRegisteredEvent(
                customerId,
                request.FullName,
                request.Phone,
                request.Email,
                request.Address ?? string.Empty,
                user.CustomerTier
            ));
        }

        return Results.Ok(new { Message = "Account created successfully.", UserId = user.Id });
    }

    private static async Task<IResult> UpdateAccountAsync(
        [FromServices] UserManager<ApplicationUser> userManager,
        [FromServices] RoleManager<IdentityRole> roleManager,
        [FromServices] IMediator mediator,
        [FromRoute] string id,
        [FromBody] UpdateAccountRequest request)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user == null)
        {
            return Results.NotFound(new { Message = "User not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.Email) && !request.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
        {
            var existingUser = await userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return Results.Conflict(new { Message = "Email already registered to another user." });
            }
            user.Email = request.Email;
            user.UserName = request.Email;
        }

        user.FullName = request.FullName;
        user.PhoneNumber = request.Phone;
        user.CustomerTier = string.IsNullOrWhiteSpace(request.CustomerTier) ? "Retail" : request.CustomerTier;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await userManager.ResetPasswordAsync(user, token, request.Password);
            if (!resetResult.Succeeded)
            {
                return Results.BadRequest(resetResult.Errors);
            }
        }

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return Results.BadRequest(result.Errors);
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var currentRoles = await userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
            {
                if (!await roleManager.RoleExistsAsync(request.Role))
                {
                    await roleManager.CreateAsync(new IdentityRole(request.Role));
                }

                await userManager.RemoveFromRolesAsync(user, currentRoles);
                await userManager.AddToRoleAsync(user, request.Role);
            }
        }

        var activeRole = request.Role ?? (await userManager.GetRolesAsync(user)).FirstOrDefault() ?? "Customer";
        if (activeRole.Equals("Customer", StringComparison.OrdinalIgnoreCase))
        {
            await mediator.Publish(new CustomerUpdatedEvent(
                Guid.Parse(user.Id),
                request.FullName,
                request.Phone ?? string.Empty,
                user.Email ?? string.Empty,
                request.Address ?? string.Empty,
                user.CustomerTier
            ));
        }

        return Results.Ok(new { Message = "Account updated successfully." });
    }

    private static async Task<IResult> LoginAsync(
        UserManager<ApplicationUser> userManager,
        TokenService tokenService,
        [FromBody] LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user == null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Results.Unauthorized();
        }

        var token = await tokenService.GenerateTokenAsync(user, userManager);
        var roles = await userManager.GetRolesAsync(user);

        return Results.Ok(new LoginResponse(
            Token: token,
            Email: user.Email ?? string.Empty,
            FullName: user.FullName,
            Roles: roles.ToList(),
            CustomerTier: user.CustomerTier
        ));
    }

    private static async Task<IResult> RegisterAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        TokenService tokenService,
        IMediator mediator,
        [FromBody] RegisterRequest request)
    {
        var userExists = await userManager.FindByEmailAsync(request.Email);
        if (userExists != null)
        {
            return Results.Conflict(new { Message = "Email already registered." });
        }

        // Generate ID ahead of time so we can link identity with module business tables
        var customerId = Guid.NewGuid();

        var user = new ApplicationUser
        {
            Id = customerId.ToString(),
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.Phone,
            CustomerTier = string.IsNullOrWhiteSpace(request.CustomerTier) ? "Retail" : request.CustomerTier
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return Results.BadRequest(result.Errors);
        }

        // Ensure "Customer" role exists
        if (!await roleManager.RoleExistsAsync("Customer"))
        {
            await roleManager.CreateAsync(new IdentityRole("Customer"));
        }

        // Map user to the Customer role
        await userManager.AddToRoleAsync(user, "Customer");

        // Publish registration event for other modules (e.g. Sales) to persist their local records
        await mediator.Publish(new CustomerRegisteredEvent(
            customerId,
            request.FullName,
            request.Phone,
            request.Email,
            request.Address,
            user.CustomerTier
        ));

        var token = await tokenService.GenerateTokenAsync(user, userManager);
        var roles = await userManager.GetRolesAsync(user);

        return Results.Ok(new LoginResponse(
            Token: token,
            Email: user.Email ?? string.Empty,
            FullName: user.FullName,
            Roles: roles.ToList(),
            CustomerTier: user.CustomerTier
        ));
    }

    #endregion

    #endregion
}

#region Request/Response Records

/// <summary>
/// Data contract for user login requests.
/// </summary>
public record LoginRequest(string Email, string Password);

/// <summary>
/// Data contract for user registration requests.
/// </summary>
public record RegisterRequest(
    string Email, 
    string Password, 
    string FullName, 
    string Phone, 
    string Address, 
    string? CustomerTier
);

/// <summary>
/// Response payload containing authentication token and profile credentials.
/// </summary>
public record LoginResponse(
    string Token, 
    string Email, 
    string FullName, 
    List<string> Roles, 
    string? CustomerTier
);

/// <summary>
/// Data contract for account creation requests.
/// </summary>
public record CreateAccountRequest(
    string Email, 
    string Password, 
    string FullName, 
    string Phone, 
    string? Role, 
    string? CustomerTier,
    string? Address
);

/// <summary>
/// Data contract for returning user details in listing.
/// </summary>
public record AccountResponse(
    string Id, 
    string Email, 
    string FullName, 
    List<string> Roles, 
    string? CustomerTier,
    string? PhoneNumber,
    string? Address
);

/// <summary>
/// Data contract for updating user details.
/// </summary>
public record UpdateAccountRequest(
    string Email, 
    string? Password, 
    string FullName, 
    string? Phone, 
    string? Role, 
    string? CustomerTier,
    string? Address
);

#endregion
