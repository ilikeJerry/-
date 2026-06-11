import type { LiveOpsIntelBundle, ReviewSnapshot, WeekChangeItem } from "@/types/liveOps";
import type { DashboardOverview, IssueRankingRow } from "@/types/dashboard";
import {
  compareSnapshots,
  compareLanguageRegions,
  sortSnapshots,
  validateSnapshotChain,
  getTrendCategoryKeys,
} from "@/lib/snapshots";
import { detectAlerts } from "@/lib/alerts";
import { categoryDisplayName } from "@/lib/categories";
import { koCategory } from "@/lib/korean";

const FOCUS_BY_CATEGORY: Record<string, string> = {
  matchmaking: "Ranked Experience",
  balance: "Combat Balance Patch",
  server: "Network Stability",
  monetization: "Monetization Clarity",
  performance: "Client Performance",
  content: "Live Ops Content Cadence",
};

function buildWeekChanges(
  categoryTrends: ReturnType<typeof compareSnapshots>,
  languageTrends: ReturnType<typeof compareLanguageRegions>,
): WeekChangeItem[] {
  const items: WeekChangeItem[] = [];

  const priorityCats = ["matchmaking", "balance", "server"];
  for (const key of priorityCats) {
    const t = categoryTrends.find((c) => c.category === key);
    if (t && t.changePercent !== 0) {
      items.push({
        direction: t.changePercent > 0 ? "up" : "down",
        label: `${t.displayName} complaints`,
        changePercent: Math.abs(t.changePercent),
      });
    }
  }

  const spanish = languageTrends.find((l) => l.category === "spanish");
  if (spanish && spanish.changePercent !== 0) {
    items.push({
      direction: spanish.changePercent > 0 ? "up" : "down",
      label: "Spanish complaints",
      changePercent: Math.abs(spanish.changePercent),
    });
  }

  return items;
}

function resolveEmergingRisk(
  weekTrends: ReturnType<typeof compareSnapshots>,
): string {
  const rising = [...weekTrends]
    .filter((t) => t.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent);
  return rising[0]
    ? categoryDisplayName(rising[0].category)
    : "Matchmaking";
}

function resolveRecommendedFocus(emergingRisk: string): string {
  const lower = emergingRisk.toLowerCase();
  const key = Object.keys(FOCUS_BY_CATEGORY).find(
    (cat) =>
      lower.includes(cat) ||
      categoryDisplayName(cat).toLowerCase() === lower,
  );
  return key ? FOCUS_BY_CATEGORY[key] : FOCUS_BY_CATEGORY.matchmaking;
}

function computeExecutiveStatus(
  alerts: LiveOpsIntelBundle["alerts"],
  overview: DashboardOverview,
  biggestRising: { category: string; displayName: string; changePercent: number } | undefined,
): LiveOpsIntelBundle["executive"] {
  const criticalAlerts = alerts.filter((a) => a.priority === "Critical").length;
  let currentStatus: LiveOpsIntelBundle["executive"]["currentStatus"] = "Stable";

  if (criticalAlerts >= 2 || overview.criticalIssues >= 6) {
    currentStatus = "Critical";
  } else if (alerts.length >= 2 || overview.criticalIssues >= 4) {
    currentStatus = "Warning";
  }

  const trending = alerts[0]?.category
    ? koCategory(alerts[0].category)
    : biggestRising
      ? koCategory(biggestRising.category)
      : "—";

  const biggestLabel = biggestRising
    ? `${koCategory(biggestRising.category)} (+${biggestRising.changePercent}%)`
    : "—";

  return {
    currentStatus,
    activeAlerts: alerts.length,
    trendingIssue: trending,
    biggestIncrease: biggestLabel,
  };
}

export function buildLiveOpsIntel(
  snapshots: ReviewSnapshot[],
  issueRanking: IssueRankingRow[],
  overview: DashboardOverview,
): LiveOpsIntelBundle | null {
  if (!validateSnapshotChain(snapshots)) {
    return null;
  }

  const sorted = sortSnapshots(snapshots);
  const baseline = sorted[0];
  const current = sorted[sorted.length - 1];
  const previousWeek = sorted.length >= 2 ? sorted[sorted.length - 2] : baseline;

  const categoryKeys = getTrendCategoryKeys(sorted);
  const periodTrends = compareSnapshots(baseline, current, categoryKeys);
  const weekCategoryTrends = compareSnapshots(
    previousWeek,
    current,
    categoryKeys,
  );
  const weekLanguageTrends = compareLanguageRegions(previousWeek, current);

  const criticalRows = issueRanking.filter((r) => r.impact === "Critical");
  const alerts = detectAlerts(
    [...weekCategoryTrends, ...weekLanguageTrends],
    criticalRows,
  );

  const changes = buildWeekChanges(weekCategoryTrends, weekLanguageTrends);
  const emerging = resolveEmergingRisk(weekCategoryTrends);
  const recommendedFocus = resolveRecommendedFocus(emerging);

  const biggestRising = [...weekCategoryTrends]
    .filter((t) => t.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)[0];

  const executive = computeExecutiveStatus(alerts, overview, biggestRising);

  return {
    simulationMode: sorted.every((s) => s.simulationMode),
    snapshotDates: sorted.map((s) => s.snapshotDate),
    periodTrends,
    weekTrends: weekCategoryTrends,
    weekLanguageTrends: weekLanguageTrends,
    alerts,
    whatChanged: {
      periodLabel: `${previousWeek.snapshotDate} → ${current.snapshotDate}`,
      changes,
      topEmergingRisk: emerging,
      recommendedFocus,
    },
    executive,
  };
}
