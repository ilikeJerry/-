import type { DashboardOverview, EvidenceItem } from "@/types/dashboard";
import type { LiveOpsExecutiveMetrics } from "@/types/liveOps";
import { formatUpdatedAt } from "@/lib/badges";
import EmptyState from "./EmptyState";
import PortfolioEvidence from "./PortfolioEvidence";
import LiveOpsStatusBar from "./LiveOpsStatusBar";

interface OverviewProps {
  data: DashboardOverview | null;
  evidenceItems: EvidenceItem[];
  executiveMetrics: LiveOpsExecutiveMetrics | null;
}

export default function Overview({
  data,
  evidenceItems,
  executiveMetrics,
}: OverviewProps) {
  if (!data) {
    return (
      <section id="overview" className="section" aria-labelledby="overview-heading">
        <EmptyState
          title="Overview를 불러올 수 없음"
          message="dashboard_overview.json 데이터가 없거나 형식이 올바르지 않습니다."
        />
      </section>
    );
  }

  return (
    <section
      id="overview"
      className="section section--executive"
      aria-labelledby="overview-heading"
    >
      <div className="executive-header">
        <div>
          <h2 id="overview-heading" className="executive-header__title">
            Executive Dashboard
          </h2>
          <p className="executive-header__meta">
            {data.projectName} · Updated {formatUpdatedAt(data.updatedAt)}
          </p>
        </div>
      </div>

      {executiveMetrics && <LiveOpsStatusBar metrics={executiveMetrics} />}

      <PortfolioEvidence items={evidenceItems} />
    </section>
  );
}
