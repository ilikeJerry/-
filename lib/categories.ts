export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  balance: "Balance",
  matchmaking: "Matchmaking",
  server: "Server",
  performance: "Performance",
  monetization: "Monetization",
  advertisement: "Advertisement",
  translation: "Translation",
  uiux: "UI/UX",
  content: "Content",
  community: "Community",
  tutorial: "Tutorial",
  toxicity: "Toxicity",
};

export const TREND_CATEGORIES = [
  "balance",
  "matchmaking",
  "server",
  "monetization",
  "performance",
  "content",
] as const;

export const LANGUAGE_DISPLAY: Record<string, string> = {
  english: "English",
  brazil_portuguese: "Brazil/Portuguese",
  spanish: "Spanish",
};

export function categoryDisplayName(key: string): string {
  return CATEGORY_DISPLAY_NAMES[key] ?? key;
}

export function percentChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function trendStatus(changePercent: number): import("@/types/liveOps").TrendStatus {
  if (changePercent <= -20) return "Improving";
  if (changePercent >= 25) return "Rising";
  return "Stable";
}
