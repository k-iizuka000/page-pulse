import type { Language } from "./storage/types";

const messages = {
  en: {
    checkingAI: "Checking AI availability...",
    keyPoints: "Key Points",
    minRead: (n: number) => `${n} min read`,
    techLevel: {
      beginner: "beginner",
      intermediate: "intermediate",
      advanced: "advanced",
    },
    error: {
      title: "Something went wrong",
      retry: "Retry",
    },
    setup: {
      enableChromeAI: "Enable Chrome AI",
      followSteps: "Follow these steps to enable the built-in AI model",
      step1: "Open the following URL in Chrome:",
      step2: 'Set to "Enabled BypassPerfRequirement"',
      step3: "Open:",
      step4: 'Set to "Enabled"',
      step5: "Restart Chrome completely",
      step6open: "Open:",
      step6find: "Find",
      step6model: "Optimization Guide On Device Model",
      step7prefix: "If version shows",
      step7action: ', click "Check for update"',
      checkAgain: "Check Again",
      downloadTitle: "AI Model Available for Download",
      downloadDesc:
        "The AI model is ready to download. It will be downloaded automatically when first used. This may take a few minutes depending on your connection.",
      tryNow: "Try Now",
      downloadingTitle: "Downloading AI Model...",
      downloadingDesc:
        "The AI model is being downloaded. This may take a few minutes. You can continue browsing in the meantime.",
    },
    langToggle: "日本語",
  },
  ja: {
    checkingAI: "AI の利用状況を確認中...",
    keyPoints: "重要ポイント",
    minRead: (n: number) => `約${n}分で読了`,
    techLevel: {
      beginner: "初級",
      intermediate: "中級",
      advanced: "上級",
    },
    error: {
      title: "エラーが発生しました",
      retry: "再試行",
    },
    setup: {
      enableChromeAI: "Chrome AI を有効にする",
      followSteps: "以下の手順で内蔵AIモデルを有効にしてください",
      step1: "Chromeで以下のURLを開いてください：",
      step2: "「Enabled BypassPerfRequirement」に設定",
      step3: "以下を開いてください：",
      step4: "「Enabled」に設定",
      step5: "Chrome を完全に再起動",
      step6open: "以下を開いてください：",
      step6find: "以下を探す",
      step6model: "Optimization Guide On Device Model",
      step7prefix: "バージョンが",
      step7action: " の場合、「Check for update」をクリック",
      checkAgain: "再確認",
      downloadTitle: "AIモデルをダウンロード可能",
      downloadDesc:
        "AIモデルのダウンロードが可能です。初回使用時に自動ダウンロードされます。接続状況により数分かかる場合があります。",
      tryNow: "今すぐ試す",
      downloadingTitle: "AIモデルをダウンロード中...",
      downloadingDesc:
        "AIモデルをダウンロードしています。数分かかる場合があります。その間、ブラウジングを続けられます。",
    },
    langToggle: "English",
  },
} as const;

export type Messages = (typeof messages)["en"];

export function t(lang: Language): Messages {
  return messages[lang];
}
