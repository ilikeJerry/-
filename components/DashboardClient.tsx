"use client";

import { useMemo } from "react";
import ChangeDetectionCenter from "./ChangeDetectionCenter";
import DataCollectionCard from "./DataCollectionCard";
import TrendDashboardKo from "./TrendDashboardKo";
import OpsAlertPanel from "./OpsAlertPanel";
import ServiceStatusPanel from "./ServiceStatusPanel";
import TopRiskIssues from "./TopRiskIssues";
import CountryOpsPanel from "./CountryOpsPanel";
import ExecutionPriorityCenter from "./ExecutionPriorityCenter";
import OpsBriefing from "./OpsBriefing";
import type { LiveOpsIntelBundle } from "@/types/liveOps";
import type {
  ActionQueueItem,
  DashboardOverview,
  IssueRankingRow,
  LanguagePanel,
} from "@/types/dashboard";
import {
  buildChangeDetectionSummary,
  buildCountryProfiles,
  buildDataCollectionStatus,
  buildExecutionPriorities,
  buildOpsAlerts,
  buildOpsBriefing,
  buildTop5Issues,
  buildTrendRowsKo,
} from "@/lib/opsProduct";

interface DashboardClientProps {
  overview: DashboardOverview | null;
  issueRanking: IssueRankingRow[];
  actionQueue: ActionQueueItem[];
  languagePanels: LanguagePanel[];
  liveOpsIntel: LiveOpsIntelBundle | null;
}

export default function DashboardClient({
  overview,
  issueRanking,
  actionQueue,
  languagePanels,
  liveOpsIntel,
}: DashboardClientProps) {
  const changeSummary = useMemo(
    () => buildChangeDetectionSummary(liveOpsIntel),
    [liveOpsIntel],
  );

  const collectionStatus = useMemo(
    () =>
      overview
        ? buildDataCollectionStatus(overview, liveOpsIntel)
        : null,
    [overview, liveOpsIntel],
  );

  const trendRows = useMemo(
    () => buildTrendRowsKo(liveOpsIntel),
    [liveOpsIntel],
  );

  const alerts = useMemo(
    () => buildOpsAlerts(liveOpsIntel, issueRanking),
    [liveOpsIntel, issueRanking],
  );

  const top5 = useMemo(
    () => buildTop5Issues(issueRanking, liveOpsIntel),
    [issueRanking, liveOpsIntel],
  );

  const countries = useMemo(
    () => buildCountryProfiles(languagePanels, liveOpsIntel),
    [languagePanels, liveOpsIntel],
  );

  const priorities = useMemo(
    () => buildExecutionPriorities(actionQueue, 5),
    [actionQueue],
  );

  const briefing = useMemo(
    () => buildOpsBriefing(issueRanking, liveOpsIntel, actionQueue),
    [issueRanking, liveOpsIntel, actionQueue],
  );

  if (!overview || !collectionStatus) {
    return (
      <main className="ops-command" id="main-content">
        <p className="muted">대시보드 데이터를 불러올 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="ops-command" id="main-content">
      <ChangeDetectionCenter summary={changeSummary} />
      <DataCollectionCard status={collectionStatus} />
      <TrendDashboardKo rows={trendRows} />
      <OpsAlertPanel alerts={alerts} />
      <ServiceStatusPanel metrics={liveOpsIntel?.executive ?? null} />
      <TopRiskIssues issues={top5} />
      <CountryOpsPanel countries={countries} />
      <ExecutionPriorityCenter items={priorities} />
      <OpsBriefing briefing={briefing} />
    </main>
  );
}
