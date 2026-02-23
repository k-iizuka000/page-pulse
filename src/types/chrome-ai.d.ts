interface AILanguageModelCapabilities {
  available: "available" | "downloadable" | "downloading" | "unavailable";
  defaultTopK?: number;
  maxTopK?: number;
  defaultTemperature?: number;
}

interface AILanguageModelPromptOptions {
  responseConstraint?: object; // JSON Schema for structured output
}

interface AILanguageModelCreateOptions {
  systemPrompt?: string;
  topK?: number;
  temperature?: number;
}

interface AILanguageModel {
  prompt(input: string, options?: AILanguageModelPromptOptions): Promise<string>;
  promptStreaming(
    input: string,
    options?: AILanguageModelPromptOptions
  ): ReadableStream<string>;
  destroy(): void;
}

interface AILanguageModelFactory {
  // New API (Chrome 138+ stable)
  availability?(): Promise<
    "available" | "downloadable" | "downloading" | "unavailable"
  >;
  // Legacy API
  capabilities?(): Promise<AILanguageModelCapabilities>;
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
}

interface AI {
  languageModel: AILanguageModelFactory;
}
