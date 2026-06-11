import type { LiveOpsExecutiveMetrics } from "@/types/liveOps";
import type { OpsHealthLevel } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";
import { mapHealthStatus } from "@/lib/opsProduct";

interface ServiceStatusPanelProps {
  metrics: LiveOpsExecutiveMetrics | null;
}

function pillClass(level: OpsHealthLevel) {
  if (level === "위험") return "status-pill status-pill--danger";
  if (level === "주의") return "status-pill status-pill--warn";
  return "status-pill status-pill--ok";
}

export default function ServiceStatusPanel({ metrics }: ServiceStatusPanelProps) {
  const status = metrics ? mapHealthStatus(metrics.currentStatus) : "주의";

  const items = metrics
    ? [
        { label: "현재 상태", value: status, isStatus: true },
        { label: "활성 알림", value: `${metrics.activeAlerts}건` },
        { label: "가장 위험한 영역", value: metrics.trendingIssue },
        { label: "가장 빠르게 증가", value: metrics.biggestIncrease },
      ]
    : [];

  return (
    <section
      id="status"
      className="ops-section ops-section--status"
      aria-labelledby="status-heading"
    >
      <header className="ops-section__head">
        <h2 id="status-heading">{PRODUCT_COPY.sections.status.title}</h2>
        <p>{PRODUCT_COPY.sections.status.desc}</p>
      </header>

      <div className="status-grid" role="list">
        {items.map((item) => (
          <article key={item.label} className="status-card" role="listitem">
            <span className="status-card__label">{item.label}</span>
            {item.isStatus ? (
              <span className={pillClass(status)}>{item.value}</span>
            ) : (
              <strong>{item.value}</strong>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
