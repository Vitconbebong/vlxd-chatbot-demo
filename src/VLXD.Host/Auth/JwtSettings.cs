namespace VLXD.Host.Auth;

/// <summary>
/// Configuration parameters representing JWT configuration options.
/// </summary>
public record JwtSettings(
    string SecretKey,
    string Issuer,
    string Audience,
    int ExpirationMinutes
);
