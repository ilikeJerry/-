import type { OpsAlertCard } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";
import EmptyState from "./EmptyState";

interface OpsAlertPanelProps {
  alerts: OpsAlertCard[];
}

function levelClass(level: OpsAlertCard["level"]) {
  if (level === "위험") return "alert-ko-card alert-ko-card--danger";
  if (level === "주의") return "alert-ko-card alert-ko-card--warn";
  return "alert-ko-card alert-ko-card--watch";
}

export default function OpsAlertPanel({ alerts }: OpsAlertPanelProps) {
  const L = PRODUCT_COPY.labels;

  return (
    <section
      id="alerts"
      className="ops-section ops-section--alerts"
      aria-labelledby="alerts-heading"
    >
      <header className="ops-section__head">
        <h2 id="alerts-heading">{PRODUCT_COPY.sections.alerts.title}</h2>
        <p>{PRODUCT_COPY.sections.alerts.desc}</p>
      </header>

      {!alerts.length ? (
        <EmptyState title="활성 경고 없음" message="현재 임계치를 초과하는 경고가 없습니다." />
      ) : (
        <div className="alert-ko-grid" role="list">
          {alerts.map((alert) => (
            <article key={alert.id} className={levelClass(alert.level)} role="listitem">
              <header className="alert-ko-card__head">
                <span className={`alert-ko-card__level alert-ko-card__level--${alert.level}`}>
                  {alert.level}
                </span>
                <h3>{alert.title}</h3>
              </header>
              <dl className="alert-ko-card__body">
                <div>
                  <dt>{L.reason}</dt>
                  <dd>{alert.reason}</dd>
                </div>
                <div>
                  <dt>{L.impactScope}</dt>
                  <dd>{alert.impactScope}</dd>
                </div>
                <div>
                  <dt>{L.recommendedAction}</dt>
                  <dd>{alert.recommendedAction}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
