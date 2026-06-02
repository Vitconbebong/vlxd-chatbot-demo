using System.Threading.Tasks;

namespace VLXD.Modules.WMS.Domain.Interfaces;

/// <summary>
/// Service contract to send SMS alerts.
/// </summary>
public interface ISmsNotifier
{
    #region Methods

    /// <summary>
    /// Sends SMS asynchronously.
    /// </summary>
    Task SendSmsAsync(string phoneNumber, string message);

    #endregion
}
