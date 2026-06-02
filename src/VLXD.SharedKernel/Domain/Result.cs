using System;

namespace VLXD.SharedKernel.Domain;

/// <summary>
/// Represents the result of an operation, containing success status and error messages.
/// </summary>
public class Result
{
    #region Properties

    /// <summary>
    /// Gets a value indicating whether the operation succeeded.
    /// </summary>
    public bool IsSuccess { get; }

    /// <summary>
    /// Gets a value indicating whether the operation failed.
    /// </summary>
    public bool IsFailure => !IsSuccess;

    /// <summary>
    /// Gets the error message if the operation failed.
    /// </summary>
    public string Error { get; }

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the Result class.
    /// </summary>
    protected Result(bool isSuccess, string error)
    {
        if (isSuccess && !string.IsNullOrEmpty(error))
        {
            throw new InvalidOperationException("A success result cannot contain an error message.");
        }
        if (!isSuccess && string.IsNullOrEmpty(error))
        {
            throw new InvalidOperationException("A failure result must contain an error message.");
        }

        IsSuccess = isSuccess;
        Error = error;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Returns a successful Result.
    /// </summary>
    public static Result Success() => new(true, string.Empty);

    /// <summary>
    /// Returns a failed Result with the specified error message.
    /// </summary>
    public static Result Failure(string error) => new(false, error);

    /// <summary>
    /// Returns a successful Result with a specified value.
    /// </summary>
    public static Result<T> Success<T>(T value) => new(value, true, string.Empty);

    /// <summary>
    /// Returns a failed Result of type T with the specified error message.
    /// </summary>
    public static Result<T> Failure<T>(string error) => new(default, false, error);

    #endregion
}

/// <summary>
/// Represents the result of an operation that returns a value of type T.
/// </summary>
public class Result<T> : Result
{
    #region Fields

    private readonly T? _value;

    #endregion

    #region Properties

    /// <summary>
    /// Gets the value associated with a successful operation.
    /// Throws InvalidOperationException if accessed on a failed operation.
    /// </summary>
    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("The value of a failure result cannot be accessed.");

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the generic Result class.
    /// </summary>
    protected internal Result(T? value, bool isSuccess, string error) : base(isSuccess, error)
    {
        _value = value;
    }

    #endregion
}
