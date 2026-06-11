import type {
  ActionQueueItem,
  ActionWithWorkflow,
  ActionWorkflowStatus,
  DashboardOverview,
  IssueRankingRow,
} from "@/types/dashboard";

const IMPACT_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const RISK_RANK: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function actionSortKey(item: ActionQueueItem): number {
  const p = (item.priority || "").toLowerCase();
  return IMPACT_RANK[p] ?? 0;
}

export function getTopPriorityActions(
  items: ActionQueueItem[],
  limit = 3,
): ActionQueueItem[] {
  return [...items]
    .sort((a, b) => actionSortKey(b) - actionSortKey(a))
    .slice(0, limit);
}

export function findIssueForAction(
  action: ActionQueueItem,
  issues: IssueRankingRow[],
): IssueRankingRow | undefined {
  return issues.find(
    (row) =>
      row.game === action.game &&
      row.category.toLowerCase() === action.category.toLowerCase(),
  );
}

export function attachWorkflow(
  items: ActionQueueItem[],
  statusMap: Record<string, ActionWorkflowStatus>,
): ActionWithWorkflow[] {
  return items.map((item) => ({
    ...item,
    workflowStatus: statusMap[item.actionId] ?? "pending",
  }));
}

export function countWorkflowByStatus(
  items: ActionWithWorkflow[],
): Record<ActionWorkflowStatus, number> {
  return items.reduce(
    (acc, item) => {
      acc[item.workflowStatus] += 1;
      return acc;
    },
    { pending: 0, in_review: 0, done: 0 } as Record<ActionWorkflowStatus, number>,
  );
}

export function getHighestBusinessRiskIssue(
  issues: IssueRankingRow[],
): IssueRankingRow | undefined {
  const sorted = [...issues].sort((a, b) => {
    const riskDiff =
      (RISK_RANK[b.businessRisk.toLowerCase()] ?? 0) -
      (RISK_RANK[a.businessRisk.toLowerCase()] ?? 0);
    if (riskDiff !== 0) return riskDiff;
    const impactDiff =
      (IMPACT_RANK[b.impact.toLowerCase()] ?? 0) -
      (IMPACT_RANK[a.impact.toLowerCase()] ?? 0);
    if (impactDiff !== 0) return impactDiff;
    return b.frequency - a.frequency;
  });
  return sorted[0];
}

export function buildDecisionSnapshot(
  overview: DashboardOverview,
  issues: IssueRankingRow[],
  actions: ActionQueueItem[],
) {
  const topActions = getTopPriorityActions(actions, 3);
  const topIssue = issues[0];
  const topBizRisk = getHighestBusinessRiskIssue(issues);

  return {
    topRiskGame: overview.topRiskGame,
    topRiskCategory: overview.topRiskCategory,
    criticalIssues: overview.criticalIssues,
    topActions,
    topIssue,
    topBizRisk,
  };
}
