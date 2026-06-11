export type SeverityLevel = "Critical" | "High" | "Medium" | "Low";

export interface DashboardOverview {
  projectName: string;
  subtitle: string;
  totalGames: number;
  totalReviews: number;
  negativeReviews: number;
  positiveReviews: number;
  topRiskGame: string;
  topRiskCategory: string;
  criticalIssues: number;
  highRiskActions: number;
  updatedAt: string;
}

export interface GameCard {
  game: string;
  reviewCount: number;
  mainIssue: string;
  mainIssueFrequency: number;
  riskLevel: SeverityLevel;
  businessRisk: SeverityLevel;
  summary: string;
  positiveDrivers: string[];
  recommendedFocus: string;
}

export interface IssueRankingRow {
  rank: number;
  game: string;
  category: string;
  issue: string;
  frequency: number;
  impact: SeverityLevel;
  businessRisk: SeverityLevel;
  recommendedActions: string[];
  expectedImpact: string;
  evidence?: string;
}

export type ActionWorkflowStatus = "pending" | "in_review" | "done";

export interface ActionQueueItem {
  actionId: string;
  game: string;
  priority: SeverityLevel;
  category: string;
  action: string;
  reason: string;
  expectedImpact: string;
  status: string;
}

export interface ActionWithWorkflow extends ActionQueueItem {
  workflowStatus: ActionWorkflowStatus;
}

export interface CopilotQuestion {
  id: string;
  label: string;
}

export interface CopilotAnswer {
  title: string;
  summary: string;
  recommendation: string;
  evidence: string[];
}

export interface GameInsightSummary {
  game: string;
  executiveSummary: string[];
  topIssueTitle?: string;
}

export interface LanguagePanel {
  game: string;
  languageGroup: string;
  reviewCount: number;
  mainComplaints: string[];
  positiveSignals: string[];
  operatorSuggestion: string;
}

export interface PortfolioStory {
  problem: string;
  approach: string;
  solution: string;
  value: string;
  connectionToGameN: string;
}

export interface EvidenceItem {
  label: string;
  value: string;
}
