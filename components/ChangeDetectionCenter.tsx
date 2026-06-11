import type { ChangeDetectionSummary } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";
import EmptyState from "./EmptyState";

interface ChangeDetectionCenterProps {
  summary: ChangeDetectionSummary | null;
}

function SignalRow({
  label,
  signal,
  fallback,
}: {
  label: string;
  signal: ChangeDetectionSummary["fastestGrowing"];
  fallback?: string;
}) {
  if (!signal) {
    return (
      <div className="cdc-highlight cdc-highlight--empty">
        <span className="cdc-highlight__label">{label}</span>
        <span className="muted">{fallback ?? "변화 없음"}</span>
      </div>
    );
  }

  return (
    <div
      className={`cdc-highlight cdc-highlight--${signal.direction === "up" ? "up" : "down"}`}
    >
      <span className="cdc-highlight__label">{label}</span>
      <div className="cdc-highlight__value">
        <strong>{signal.label}</strong>
        <span className={`cdc-highlight__pct cdc-highlight__pct--${signal.direction}`}>
          {signal.direction === "up" ? "+" : "-"}
          {signal.changePercent}%
        </span>
      </div>
    </div>
  );
}

export default function ChangeDetectionCenter({
  summary,
}: ChangeDetectionCenterProps) {
  const L = PRODUCT_COPY.labels;

  return (
    <section
      id="changes"
      className="ops-section ops-section--cdc"
      aria-labelledby="changes-heading"
    >
      <header className="cdc-platform-head">
        <p className="cdc-platform-head__tag">{PRODUCT_COPY.platform.tagline}</p>
        <h1 id="changes-heading" className="cdc-platform-head__title">
          {PRODUCT_COPY.platform.title}
        </h1>
        <p className="cdc-platform-head__sub">{PRODUCT_COPY.platform.subtitle}</p>
      </header>

      <div className="cdc-head">
        <h2>{PRODUCT_COPY.sections.changes.title}</h2>
        <p>{PRODUCT_COPY.sections.changes.desc}</p>
        {summary?.periodLabel && (
          <span className="ops-section__meta">{summary.periodLabel}</span>
        )}
      </div>

      {!summary ? (
        <EmptyState title="변화 데이터 없음" message="스냅샷 비교 데이터가 없습니다." />
      ) : (
        <>
          <div className="cdc-highlights">
            <SignalRow label={L.fastestUp} signal={summary.fastestGrowing} />
            <SignalRow label={L.fastestDown} signal={summary.fastestDeclining} />
          </div>

          {summary.newRiskSignals.length > 0 && (
            <div className="cdc-block">
              <h3 className="cdc-block__title">{L.newRisks}</h3>
              <div className="change-signals" role="list">
                {summary.newRiskSignals.map((s) => (
                  <article
                    key={s.id}
                    className="change-signal change-signal--critical"
                    role="listitem"
                  >
                    <span aria-hidden="true">🚨</span>
                    <strong>{s.label}</strong>
                    <span className="change-signal__pct change-signal__pct--up">
                      +{s.changePercent}%
                    </span>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="cdc-block cdc-block--priorities">
            <h3 className="cdc-block__title">{L.recommended}</h3>
            <ol className="cdc-priorities">
              {summary.recommendedPriorities.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}
