import type { OpsAlert } from "@/types/liveOps";
import EmptyState from "./EmptyState";

interface AlertsPanelProps {
  alerts: OpsAlert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <article className="alerts-panel" aria-label="Operational alerts">
      <h3>Alert Detection</h3>
      <p className="alerts-panel__desc">
        Issue 증가율 30% 이상 또는 Critical 이슈 발생 시 자동 생성 (룰 기반)
      </p>

      {!alerts.length ? (
        <EmptyState
          title="활성 알림 없음"
          message="현재 스냅샷 기준 임계치를 초과하는 알림이 없습니다."
        />
      ) : (
        <ul className="alerts-list" role="list">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`alert-card alert-card--${alert.priority.toLowerCase()}`}
              role="listitem"
            >
              <div className="alert-card__head">
                <span className="alert-card__tag">ALERT</span>
                <code>{alert.id}</code>
                <span
                  className={`alert-priority alert-priority--${alert.priority.toLowerCase()}`}
                >
                  Priority: {alert.priority}
                </span>
              </div>
              <p>{alert.message}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
