import type { LiveOpsIntelBundle } from "@/types/liveOps";
import { SECTIONS } from "@/lib/copy";
import EmptyState from "./EmptyState";

interface WhatChangedPanelProps {
  intel: LiveOpsIntelBundle | null;
}

export default function WhatChangedPanel({ intel }: WhatChangedPanelProps) {
  if (!intel) {
    return (
      <section id="what-changed" className="section section--what-changed">
        <EmptyState
          title="스냅샷 데이터 없음"
          message="snapshots/ 폴더에 2개 이상의 스냅샷이 필요합니다."
        />
      </section>
    );
  }

  const { whatChanged, alerts, executive, simulationMode } = intel;
  const criticalAlerts = alerts.filter((a) => a.priority === "Critical");
  const topChanges = whatChanged.changes.slice(0, 4);
  const statusClass = `wc-status wc-status--${executive.currentStatus.toLowerCase()}`;

  return (
    <section
      id="what-changed"
      className="section section--what-changed"
      aria-labelledby="what-changed-heading"
    >
      <div className="wc-hero">
        <div className="wc-hero__head">
          <div>
            <p className="wc-hero__eyebrow">{SECTIONS.whatChanged.title}</p>
            <h2 id="what-changed-heading" className="wc-hero__title">
              {whatChanged.topEmergingRisk} — 가장 빠르게 악화 중
            </h2>
          </div>
          <div className={statusClass} role="status">
            <span className="wc-status__dot" aria-hidden="true" />
            <span className="wc-status__label">현재 상태</span>
            <strong>{executive.currentStatus}</strong>
          </div>
        </div>

        <div className="wc-hero__action">
          <span className="wc-hero__action-label">지금 해야 할 일</span>
          <strong>{whatChanged.recommendedFocus}</strong>
        </div>

        {simulationMode && (
          <p className="wc-sim-note" role="note">
            {whatChanged.periodLabel} · Simulation
          </p>
        )}
      </div>

      <div className="wc-body">
        <div className="wc-changes" aria-label="주간 변화">
          <h3 className="wc-section-label">주간 변화</h3>
          {topChanges.length ? (
            <div className="wc-change-bars" role="list">
              {topChanges.map((item) => (
                <div
                  key={item.label}
                  className={`wc-change-bar wc-change-bar--${item.direction}`}
                  role="listitem"
                >
                  <div className="wc-change-bar__meta">
                    <span className="wc-change-bar__arrow" aria-hidden="true">
                      {item.direction === "up" ? "↑" : "↓"}
                    </span>
                    <span className="wc-change-bar__label">{item.label}</span>
                    <strong className="wc-change-bar__pct">
                      {item.direction === "up" ? "+" : "-"}
                      {item.changePercent}%
                    </strong>
                  </div>
                  <div className="wc-change-bar__track" aria-hidden="true">
                    <div
                      className="wc-change-bar__fill"
                      style={{
                        width: `${Math.min(100, item.changePercent)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">유의미한 주간 변화 없음</p>
          )}
        </div>

        <div className="wc-alerts" aria-label="활성 알림">
          <h3 className="wc-section-label">
            활성 알림
            <span className="wc-alert-count">{alerts.length}</span>
          </h3>
          {!alerts.length ? (
            <p className="muted">임계치 초과 알림 없음</p>
          ) : (
            <ul className="wc-alert-list" role="list">
              {(criticalAlerts.length ? criticalAlerts : alerts)
                .slice(0, 3)
                .map((alert) => (
                  <li
                    key={alert.id}
                    className={`wc-alert-item wc-alert-item--${alert.priority.toLowerCase()}`}
                    role="listitem"
                  >
                    <span className="wc-alert-item__priority">
                      {alert.priority}
                    </span>
                    <p>{alert.message}</p>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
