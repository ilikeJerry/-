import type { OpsAlert, CategoryTrendRow } from "@/types/liveOps";
import type { IssueRankingRow } from "@/types/dashboard";
import { categoryDisplayName } from "@/lib/categories";

const INCREASE_ALERT_THRESHOLD = 30;

export function detectAlerts(
  weekTrends: CategoryTrendRow[],
  criticalRows: IssueRankingRow[],
): OpsAlert[] {
  const alerts: OpsAlert[] = [];
  let alertIndex = 1;

  for (const trend of weekTrends) {
    if (trend.changePercent >= INCREASE_ALERT_THRESHOLD) {
      alerts.push({
        id: `ALERT-${String(alertIndex++).padStart(3, "0")}`,
        message: `${trend.displayName} complaints increased by ${trend.changePercent}%.`,
        priority: trend.changePercent >= 50 ? "Critical" : "High",
        category: trend.category,
      });
    }
  }

  const criticalCategories = new Set(
    criticalRows
      .filter((r) => r.impact === "Critical")
      .map((r) => r.category),
  );

  for (const cat of Array.from(criticalCategories)) {
    const trend = weekTrends.find((t) => t.category === cat);
    const already = alerts.some((a) => a.category === cat);
    if (!already) {
      alerts.push({
        id: `ALERT-${String(alertIndex++).padStart(3, "0")}`,
        message: `Critical ${categoryDisplayName(cat)} issues detected in current snapshot.`,
        priority: "Critical",
        category: cat,
      });
    }
  }

  return alerts.sort((a, b) => {
    const order = { Critical: 0, High: 1, Medium: 2 };
    return order[a.priority] - order[b.priority];
  });
}
