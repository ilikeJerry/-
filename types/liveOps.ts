export type TrendStatus = "Rising" | "Stable" | "Improving";
export type OpsHealthStatus = "Stable" | "Warning" | "Critical";
export type AlertPriority = "High" | "Critical" | "Medium";

export interface ReviewSnapshot {
  snapshotDate: string;
  simulationMode: boolean;
  label: string;
  categories: Record<string, number>;
  languageRegions: Record<string, number>;
  criticalIssueCount: number;
}

export interface CategoryTrendRow {
  category: string;
  displayName: string;
  previousSnapshot: number;
  currentSnapshot: number;
  changePercent: number;
  status: TrendStatus;
}

export interface WeekChangeItem {
  direction: "up" | "down";
  label: string;
  changePercent: number;
}

export interface OpsAlert {
  id: string;
  message: string;
  priority: AlertPriority;
  category: string;
}

export interface WhatChangedSummary {
  periodLabel: string;
  changes: WeekChangeItem[];
  topEmergingRisk: string;
  recommendedFocus: string;
}

export interface LiveOpsExecutiveMetrics {
  currentStatus: OpsHealthStatus;
  activeAlerts: number;
  trendingIssue: string;
  biggestIncrease: string;
}

export interface LiveOpsIntelBundle {
  simulationMode: boolean;
  snapshotDates: string[];
  periodTrends: CategoryTrendRow[];
  weekTrends: CategoryTrendRow[];
  weekLanguageTrends: CategoryTrendRow[];
  alerts: OpsAlert[];
  whatChanged: WhatChangedSummary;
  executive: LiveOpsExecutiveMetrics;
}
