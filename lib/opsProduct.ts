import type {
  ActionQueueItem,
  DashboardOverview,
  IssueRankingRow,
  LanguagePanel,
} from "@/types/dashboard";
import type { LiveOpsIntelBundle } from "@/types/liveOps";
import type {
  ChangeDetectionSummary,
  CountryOpsProfile,
  DataCollectionStatus,
  ExecutionPriorityItem,
  OpsAlertCard,
  OpsBriefingContent,
  OpsChangeSignal,
  OpsHealthLevel,
  TopRiskIssueCard,
  TrendRowKo,
} from "@/types/opsProduct";
import {
  koAction,
  koCategory,
  koEffect,
  koIssue,
  koPositive,
  koRegion,
  koSeverity,
  koTrendStatus,
  koAlertLevel,
} from "@/lib/korean";
import { getTopPriorityActions } from "@/lib/operations";

export function mapHealthStatus(
  status: LiveOpsIntelBundle["executive"]["currentStatus"],
): OpsHealthLevel {
  if (status === "Critical") return "위험";
  if (status === "Warning") return "주의";
  return "정상";
}

function buildSignals(intel: LiveOpsIntelBundle): OpsChangeSignal[] {
  const signals: OpsChangeSignal[] = [];
  let idx = 0;
  const allTrends = [...intel.weekTrends, ...intel.weekLanguageTrends];

  for (const trend of allTrends) {
    if (trend.changePercent === 0) continue;
    const isLang = trend.category in { english: 1, brazil_portuguese: 1, spanish: 1 };
    const label = isLang
      ? `${koRegion(trend.category)} 불만`
      : koCategory(trend.category);
    signals.push({
      id: `chg-${idx++}`,
      label,
      changePercent: Math.abs(trend.changePercent),
      direction: trend.changePercent > 0 ? "up" : "down",
      severity:
        trend.changePercent >= 30
          ? "critical"
          : trend.changePercent > 0
            ? "warning"
            : "positive",
    });
  }

  return signals.sort((a, b) => {
    if (a.direction !== b.direction) return a.direction === "up" ? -1 : 1;
    return b.changePercent - a.changePercent;
  });
}

export function buildChangeDetectionSummary(
  intel: LiveOpsIntelBundle | null,
): ChangeDetectionSummary | null {
  if (!intel) return null;

  const allSignals = buildSignals(intel);
  const rising = allSignals.filter((s) => s.direction === "up");
  const declining = allSignals.filter((s) => s.direction === "down");

  const priorities = [
    rising[0] ? `${rising[0].label} 개선` : "매칭 품질 개선",
    rising[1] ? `${rising[1].label} 점검` : "과금 UX 점검",
    rising[2] ? `${rising[2].label} 대응` : "랭크 경험 개선",
  ].map((p, i) => `${i + 1}순위 ${p}`);

  return {
    fastestGrowing: rising[0] ?? null,
    fastestDeclining: declining[0] ?? null,
    newRiskSignals: rising.filter((s) => s.severity === "critical").slice(0, 3),
    recommendedPriorities: priorities,
    allSignals,
    periodLabel: intel.whatChanged.periodLabel,
  };
}

export function buildDataCollectionStatus(
  overview: DashboardOverview,
  intel: LiveOpsIntelBundle | null,
): DataCollectionStatus {
  const lastDate = intel?.snapshotDates[intel.snapshotDates.length - 1] ?? "2026-06-15";
  const nextDate = addDays(lastDate, 7);

  return {
    lastCollectedAt: `${lastDate} 09:00`,
    collectionSchedule: "매주 월요일 09:00",
    totalReviews: overview.totalReviews,
    nextCollectionAt: `${nextDate} 09:00`,
    snapshotDates: intel?.snapshotDates ?? ["2026-06-01", "2026-06-08", "2026-06-15"],
  };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildTrendRowsKo(
  intel: LiveOpsIntelBundle | null,
): TrendRowKo[] {
  if (!intel) return [];

  return intel.weekTrends
    .filter((t) => ["matchmaking", "monetization", "server", "balance", "performance", "content"].includes(t.category))
    .sort((a, b) => b.changePercent - a.changePercent)
    .map((t) => ({
      category: t.category,
      label: koCategory(t.category),
      previous: t.previousSnapshot,
      current: t.currentSnapshot,
      changePercent: t.changePercent,
      statusKo: koTrendStatus(t.status),
    }));
}

export function buildOpsAlerts(
  intel: LiveOpsIntelBundle | null,
  issues: IssueRankingRow[],
): OpsAlertCard[] {
  if (!intel) return [];

  const cards: OpsAlertCard[] = [];

  for (const alert of intel.alerts) {
    const level = koAlertLevel(alert.priority);
    const catKo = koCategory(alert.category);
    cards.push({
      id: alert.id,
      level,
      title: `${catKo} 운영 경고`,
      reason: alert.message.replace(/complaints increased by/i, "불만 증가율").replace(/Critical/i, "위험"),
      impactScope: `글로벌 포트폴리오 · ${catKo} 카테고리`,
      recommendedAction:
        issues.find((i) => i.category === alert.category)?.recommendedActions?.[0]
          ? koAction(
              issues.find((i) => i.category === alert.category)!
                .recommendedActions![0],
            )
          : `${catKo} 긴급 점검`,
    });
  }

  const criticalIssues = issues.filter((i) => i.impact === "Critical").slice(0, 2);
  for (const issue of criticalIssues) {
    if (cards.some((c) => c.title.includes(koCategory(issue.category)))) continue;
    cards.push({
      id: `CRIT-${issue.rank}`,
      level: "위험",
      title: `신규 위험: ${koIssue(issue.issue)}`,
      reason: `${issue.game}에서 ${issue.frequency}건 리뷰 신호 감지`,
      impactScope: `${issue.game} · ${koSeverity(issue.businessRisk)} 비즈니스 리스크`,
      recommendedAction: koAction(issue.recommendedActions?.[0] ?? "긴급 대응"),
    });
  }

  return cards.slice(0, 6);
}

function growthForCategory(
  intel: LiveOpsIntelBundle | null,
  category: string,
): number {
  return intel?.weekTrends.find((t) => t.category === category)?.changePercent ?? 0;
}

export function buildTop5Issues(
  issues: IssueRankingRow[],
  intel: LiveOpsIntelBundle | null,
): TopRiskIssueCard[] {
  return issues.slice(0, 5).map((row) => ({
    rank: row.rank,
    title: koIssue(row.issue),
    game: row.game,
    riskLevelKo: koSeverity(row.impact),
    growthRate: growthForCategory(intel, row.category),
    reviewCount: row.frequency,
    recommendedAction: koAction(row.recommendedActions?.[0] ?? "—"),
    expectedEffect: koEffect(row.expectedImpact),
  }));
}

function riskFromComplaints(complaints: string[]): OpsHealthLevel {
  const top = complaints[0]?.toLowerCase() ?? "";
  if (top.includes("matchmaking") || top.includes("monetization") || top.includes("server"))
    return "위험";
  if (complaints.length >= 3) return "주의";
  return "정상";
}

function aggregatePanels(panels: LanguagePanel[], languageGroup: string) {
  return panels.filter((p) => p.languageGroup === languageGroup);
}

function buildPanelRegion(
  id: string,
  region: string,
  panels: LanguagePanel[],
  changePercent: number | null,
  growingLabel: string,
): CountryOpsProfile {
  const complaints = panels.flatMap((p) => p.mainComplaints).filter(Boolean);
  const positives = panels.flatMap((p) => p.positiveSignals).filter(Boolean);

  return {
    id,
    region,
    riskLevel: riskFromComplaints(complaints),
    topComplaint: koIssue(complaints[0] ?? "—"),
    positiveSignal: koPositive(positives[0] ?? "—"),
    growingIssue: growingLabel,
    recommendedAction: koAction(panels[0]?.operatorSuggestion ?? "—"),
    opsMemo:
      changePercent !== null && changePercent >= 20
        ? `주간 불만 ${changePercent > 0 ? "+" : ""}${changePercent}% — 우선 모니터링`
        : "글로벌 확장 트래픽 대비 주간 추세 확인",
    changePercent,
  };
}

export function buildCountryProfiles(
  panels: LanguagePanel[],
  intel: LiveOpsIntelBundle | null,
): CountryOpsProfile[] {
  const langTrends = intel?.weekLanguageTrends ?? [];
  const getChange = (key: string) =>
    langTrends.find((t) => t.category === key)?.changePercent ?? null;

  const translationTrend = intel?.weekTrends.find((t) => t.category === "translation");
  const performanceTrend = intel?.weekTrends.find((t) => t.category === "performance");

  const brazilChange = getChange("brazil_portuguese");
  const spanishChange = getChange("spanish");

  return [
    buildPanelRegion(
      "brazil",
      "브라질",
      aggregatePanels(panels, "Brazil/Portuguese"),
      brazilChange,
      brazilChange && brazilChange > 0 ? `매칭 불만 +${brazilChange}%` : "매칭·과금 모니터링",
    ),
    {
      id: "india",
      region: "인도",
      riskLevel: (translationTrend?.changePercent ?? 0) >= 20 ? "주의" : "정상",
      topComplaint: "현지화·결제 UX",
      positiveSignal: "글로벌 확장 수요 증가",
      growingIssue: translationTrend
        ? `번역 피드백 ${translationTrend.changePercent > 0 ? "+" : ""}${translationTrend.changePercent}%`
        : "신규 시장 데이터 수집 중",
      recommendedAction: "인도 시장 결제·언어 UX 로컬라이제이션 점검",
      opsMemo: "전용 언어권 스냅샷 확대 권장",
      changePercent: translationTrend?.changePercent ?? null,
    },
    {
      id: "vietnam",
      region: "베트남",
      riskLevel: (performanceTrend?.changePercent ?? 0) >= 15 ? "주의" : "정상",
      topComplaint: "클라이언트 성능·네트워크",
      positiveSignal: "모바일·캐주얼 수요",
      growingIssue: performanceTrend
        ? `성능 피드백 ${performanceTrend.changePercent > 0 ? "+" : ""}${performanceTrend.changePercent}%`
        : "APAC 인프라 모니터링",
      recommendedAction: "동남아 저사양 기기 성능 프로파일링",
      opsMemo: "베트남 트래픽 증가 대비 서버·결제 점검",
      changePercent: performanceTrend?.changePercent ?? null,
    },
    buildPanelRegion(
      "english",
      "영어권",
      aggregatePanels(panels, "English"),
      getChange("english"),
      "글로벌 기본 권역 — 포트폴리오 전체 추세 반영",
    ),
    buildPanelRegion(
      "spanish",
      "스페인어권",
      aggregatePanels(panels, "Spanish"),
      spanishChange,
      spanishChange && spanishChange > 0 ? `과금 피로 +${spanishChange}%` : "과금·매칭 추세 관찰",
    ),
  ];
}

const EFFORT: Record<string, string> = {
  matchmaking: "중간",
  monetization: "중간",
  server: "높음",
  performance: "높음",
  balance: "중간",
  uiux: "낮음",
  content: "중간",
  community: "낮음",
};

export function buildExecutionPriorities(
  actions: ActionQueueItem[],
  limit = 5,
): ExecutionPriorityItem[] {
  const seen = new Set<string>();
  const items: ExecutionPriorityItem[] = [];

  for (const action of getTopPriorityActions(actions, 50)) {
    const key = `${action.category}::${action.action.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      rank: items.length + 1,
      actionId: action.actionId,
      title: koAction(action.action),
      game: action.game,
      expectedEffect: koEffect(action.expectedImpact),
      impactLevel:
        action.priority === "Critical" || action.priority === "High" ? "높음" : "중간",
      effortLevel: EFFORT[action.category.toLowerCase()] ?? "중간",
    });
    if (items.length >= limit) break;
  }

  return items;
}

export function buildOpsBriefing(
  issues: IssueRankingRow[],
  intel: LiveOpsIntelBundle | null,
  actions: ActionQueueItem[],
): OpsBriefingContent {
  const topIssue = issues[0];
  const topAction = getTopPriorityActions(actions, 1)[0];
  const growth = topIssue ? growthForCategory(intel, topIssue.category) : 0;
  const periodLabel = intel?.whatChanged.periodLabel ?? "최근 2주";

  return {
    headline: "오늘의 운영 브리핑",
    topRisk: topIssue ? koIssue(topIssue.issue) : "매칭 품질",
    whyItMatters:
      growth > 0
        ? `${periodLabel} 기간 ${koCategory(topIssue?.category ?? "matchmaking")} 불만 ${growth}% 증가`
        : "현재 스냅샷 기준 최상위 위험 이슈",
    impact: growth > 30 ? "신규 유저 유지율 저하 가능성" : "부정 리뷰 확산 및 이탈 리스크",
    recommendedAction: topAction
      ? koAction(topAction.action)
      : koAction(topIssue?.recommendedActions?.[0] ?? "MMR 범위 점검"),
    expectedEffect: topAction
      ? koEffect(topAction.expectedImpact)
      : "랭크 이탈 감소",
    periodLabel,
  };
}
