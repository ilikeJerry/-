import type { LiveOpsExecutiveMetrics } from "@/types/liveOps";

interface LiveOpsStatusBarProps {
  metrics: LiveOpsExecutiveMetrics;
}

const KPI_CONFIG = [
  {
    key: "status",
    label: "현재 상태",
    getValue: (m: LiveOpsExecutiveMetrics) => m.currentStatus,
    className: (m: LiveOpsExecutiveMetrics) =>
      `exec-kpi exec-kpi--status exec-kpi--${m.currentStatus.toLowerCase()}`,
  },
  {
    key: "alerts",
    label: "활성 알림",
    getValue: (m: LiveOpsExecutiveMetrics) => String(m.activeAlerts),
    className: (m: LiveOpsExecutiveMetrics) =>
      `exec-kpi exec-kpi--alerts${m.activeAlerts > 0 ? " exec-kpi--warning" : ""}`,
  },
  {
    key: "risk",
    label: "최대 위험 영역",
    getValue: (m: LiveOpsExecutiveMetrics) => m.trendingIssue,
    className: () => "exec-kpi exec-kpi--risk",
  },
  {
    key: "growth",
    label: "가장 빠른 증가",
    getValue: (m: LiveOpsExecutiveMetrics) => m.biggestIncrease,
    className: () => "exec-kpi exec-kpi--growth",
  },
] as const;

export default function LiveOpsStatusBar({ metrics }: LiveOpsStatusBarProps) {
  return (
    <div
      className="exec-kpi-grid"
      role="list"
      aria-label="Executive KPIs"
    >
      {KPI_CONFIG.map((kpi) => (
        <article
          key={kpi.key}
          className={kpi.className(metrics)}
          role="listitem"
        >
          <span className="exec-kpi__label">{kpi.label}</span>
          <strong className="exec-kpi__value">{kpi.getValue(metrics)}</strong>
        </article>
      ))}
    </div>
  );
}
