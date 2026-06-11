import type { SeverityLevel } from "./dashboard";

export type OpsHealthLevel = "정상" | "주의" | "위험";
export type AlertLevelKo = "위험" | "주의" | "관찰";

export interface OpsChangeSignal {
  id: string;
  label: string;
  changePercent: number;
  direction: "up" | "down";
  severity: "critical" | "warning" | "positive";
}

export interface ChangeDetectionSummary {
  fastestGrowing: OpsChangeSignal | null;
  fastestDeclining: OpsChangeSignal | null;
  newRiskSignals: OpsChangeSignal[];
  recommendedPriorities: string[];
  allSignals: OpsChangeSignal[];
  periodLabel: string;
}

export interface DataCollectionStatus {
  lastCollectedAt: string;
  collectionSchedule: string;
  totalReviews: number;
  nextCollectionAt: string;
  snapshotDates: string[];
}

export interface TrendRowKo {
  category: string;
  label: string;
  previous: number;
  current: number;
  changePercent: number;
  statusKo: string;
}

export interface OpsAlertCard {
  id: string;
  level: AlertLevelKo;
  title: string;
  reason: string;
  impactScope: string;
  recommendedAction: string;
}

export interface TopRiskIssueCard {
  rank: number;
  title: string;
  game: string;
  riskLevelKo: string;
  growthRate: number;
  reviewCount: number;
  recommendedAction: string;
  expectedEffect: string;
}

export interface CountryOpsProfile {
  id: string;
  region: string;
  riskLevel: OpsHealthLevel;
  topComplaint: string;
  positiveSignal: string;
  growingIssue: string;
  recommendedAction: string;
  opsMemo: string;
  changePercent: number | null;
}

export interface ExecutionPriorityItem {
  rank: number;
  actionId: string;
  title: string;
  game: string;
  expectedEffect: string;
  impactLevel: string;
  effortLevel: string;
}

export interface OpsBriefingContent {
  headline: string;
  topRisk: string;
  whyItMatters: string;
  impact: string;
  recommendedAction: string;
  expectedEffect: string;
  periodLabel: string;
}
