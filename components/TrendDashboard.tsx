import type { CategoryTrendRow, LiveOpsIntelBundle } from "@/types/liveOps";
import { SECTIONS } from "@/lib/copy";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";

interface TrendDashboardProps {
  intel: LiveOpsIntelBundle | null;
}

function TrendBar({ row, maxChange }: { row: CategoryTrendRow; maxChange: number }) {
  const barWidth = maxChange > 0
    ? Math.min(100, (Math.abs(row.changePercent) / maxChange) * 100)
    : 0;
  const isRising = row.status === "Rising";

  return (
    <article
      className={`trend-viz-row trend-viz-row--${row.status.toLowerCase()}`}
      role="listitem"
    >
      <div className="trend-viz-row__header">
        <h3 className="trend-viz-row__name">{row.displayName}</h3>
        <span
          className={`trend-status trend-status--${row.status.toLowerCase()}`}
        >
          {row.status}
        </span>
      </div>

      <div className="trend-viz-row__chart" aria-hidden="true">
        <div className="trend-viz-row__baseline">
          <span>{row.previousSnapshot}</span>
          <span className="trend-viz-row__arrow">→</span>
          <span>{row.currentSnapshot}</span>
        </div>
        <div className="trend-viz-row__bar-track">
          <div
            className={`trend-viz-row__bar-fill trend-viz-row__bar-fill--${isRising ? "up" : row.status === "Improving" ? "down" : "flat"}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      <div className="trend-viz-row__change">
        <strong>
          {row.changePercent > 0 ? "+" : ""}
          {row.changePercent}%
        </strong>
        <span className="trend-viz-row__change-label">vs 이전 스냅샷</span>
      </div>
    </article>
  );
}

export default function TrendDashboard({ intel }: TrendDashboardProps) {
  if (!intel?.periodTrends.length) {
    return (
      <section id="trends" className="section">
        <EmptyState title="트렌드 없음" message="스냅샷 비교 데이터가 없습니다." />
      </section>
    );
  }

  const dates = intel.snapshotDates;
  const rangeLabel =
    dates.length >= 2
      ? `${dates[0]} → ${dates[dates.length - 1]}`
      : "Snapshot range";

  const sorted = [...intel.periodTrends].sort((a, b) => {
    const statusOrder = { Rising: 0, Stable: 1, Improving: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.changePercent - a.changePercent;
  });

  const maxChange = Math.max(
    ...sorted.map((r) => Math.abs(r.changePercent)),
    1,
  );

  return (
    <section
      id="trends"
      className="section section--trends section--trends-hero"
      aria-labelledby="trends-heading"
    >
      <SectionHeader
        id="trends-heading"
        title={SECTIONS.trends.title}
        description="운영 카테고리별 변화 추세 — 핵심 차별점"
      />

      <div className="trend-viz-meta">
        <span className="trend-viz-meta__range">{rangeLabel}</span>
        {intel.simulationMode && (
          <span className="trend-viz-meta__sim">Simulation</span>
        )}
      </div>

      <div className="trend-viz-grid" role="list" aria-label="카테고리별 추세">
        {sorted.map((row) => (
          <TrendBar key={row.category} row={row} maxChange={maxChange} />
        ))}
      </div>
    </section>
  );
}
