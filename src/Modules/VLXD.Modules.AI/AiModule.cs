using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.AI;
using OllamaSharp;
using OpenAI;
using VLXD.Modules.AI.Infrastructure;
using VLXD.Modules.AI.Application.Services;

namespace VLXD.Modules.AI;

/// <summary>
/// Service registration entry point for the AI module.
/// </summary>
public static class AiModule
{
    #region Methods

    /// <summary>
    /// Registers all dependencies of the AI module, including DbContext, Ollama/Gemini clients, and support services.
    /// </summary>
    public static IServiceCollection AddAiModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // DB Context registration
        services.AddDbContext<AiDbContext>(options =>
            options.UseSqlServer(connectionString));

        // Memory cache registration for VectorSearchService
        services.AddMemoryCache();

        // 1. Dynamic AI Abstraction configuration (Adapter Pattern)
        var provider = configuration["AI:Provider"] ?? "Ollama";

        if (provider.Equals("Ollama", StringComparison.OrdinalIgnoreCase))
        {
            var endpoint = configuration["AI:Ollama:Endpoint"] ?? "http://localhost:11434";
            var chatModel = configuration["AI:Ollama:ChatModel"] ?? "gemma2:9b";
            var embeddingModel = configuration["AI:Ollama:EmbeddingModel"] ?? "nomic-embed-text";

            // Register chat client with SelectedModel set
            services.AddSingleton<IChatClient>(sp =>
            {
                var client = new OllamaApiClient(new Uri(endpoint));
                client.SelectedModel = chatModel;
                return client;
            });

            // Register embedding generator with SelectedModel set
            services.AddSingleton<IEmbeddingGenerator<string, Embedding<float>>>(sp =>
            {
                var client = new OllamaApiClient(new Uri(endpoint));
                client.SelectedModel = embeddingModel;
                return client;
            });
        }
        else if (provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            var apiKey = configuration["AI:Gemini:ApiKey"];
            var chatModel = configuration["AI:Gemini:ChatModel"] ?? "gemini-2.5-flash";
            var embeddingModel = configuration["AI:Gemini:EmbeddingModel"] ?? "text-embedding-004";

            // OpenAI SDK setup pointing to Google Generative AI OpenAI-compatible endpoint
            var openAIClient = new OpenAIClient(
                new System.ClientModel.ApiKeyCredential(apiKey ?? string.Empty),
                new OpenAIClientOptions { Endpoint = new Uri("https://generativelanguage.googleapis.com/v1beta/openai/") }
            );

            services.AddSingleton<IChatClient>(sp => openAIClient.AsChatClient(chatModel));
            services.AddSingleton<IEmbeddingGenerator<string, Embedding<float>>>(sp => openAIClient.AsEmbeddingGenerator(embeddingModel));
        }

        // 2. Support services registration
        services.AddScoped<MaterialCalculator>();
        services.AddScoped<FuzzyMatchService>();
        services.AddScoped<EmbeddingService>();
        services.AddScoped<VectorSearchService>();
        services.AddScoped<SentimentAnalyzer>();
        services.AddScoped<RagService>();
        services.AddScoped<ChatOrchestrator>();

        return services;
    }

    #endregion
}
