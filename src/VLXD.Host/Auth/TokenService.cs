using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace VLXD.Host.Auth;

/// <summary>
/// Service in charge of generating authentication JSON Web Tokens.
/// </summary>
public class TokenService
{
    #region Fields

    private readonly IConfiguration _configuration;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the TokenService class.
    /// </summary>
    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Generates a signed JWT token containing standard claims and role profiles.
    /// </summary>
    public async Task<string> GenerateTokenAsync(ApplicationUser user, UserManager<ApplicationUser> userManager)
    {
        var secretKey = _configuration["JwtSettings:SecretKey"] ?? "VlxdSmartSystem2024SuperSecretKeyThatIsLongEnough!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "VLXD.Host";
        var audience = _configuration["JwtSettings:Audience"] ?? "VLXD.Clients";
        var expirationMinutes = int.Parse(_configuration["JwtSettings:ExpirationMinutes"] ?? "1440");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("name", user.FullName)
        };

        // Inject customer tier info if relevant
        if (!string.IsNullOrEmpty(user.CustomerTier))
        {
            claims.Add(new Claim("customer_tier", user.CustomerTier));
        }

        // Add user roles as role claims
        var roles = await userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    #endregion
}
