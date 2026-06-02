using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VLXD.Modules.WMS.Domain.Interfaces;

namespace VLXD.Modules.WMS.Infrastructure.MockAdapters;

/// <summary>
/// Mock SMS notification adapter that logs messages to the application log instead of sending real SMS.
/// </summary>
public class MockSmsNotifier : ISmsNotifier
{
    #region Fields

    private readonly ILogger<MockSmsNotifier> _logger;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the MockSmsNotifier class.
    /// </summary>
    public MockSmsNotifier(ILogger<MockSmsNotifier> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Methods

    /// <summary>
    /// Simulates sending an SMS by logging it.
    /// </summary>
    public Task SendSmsAsync(string phoneNumber, string message)
    {
        _logger.LogInformation("[SMS SEND MOCK] To: {PhoneNumber} | Message: {Message}", phoneNumber, message);
        return Task.CompletedTask;
    }

    #endregion
}
