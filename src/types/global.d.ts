declare global {
  interface Window {
    ai?: AI;
  }
  // For service worker context
  // eslint-disable-next-line no-var
  var ai: AI | undefined;

  // Chrome 138+ exposes LanguageModel as a global constructor
  // eslint-disable-next-line no-var
  var LanguageModel: AILanguageModelFactory | undefined;
}

export {};
