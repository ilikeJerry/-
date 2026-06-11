"use client";

import type { ActionQueueItem, DashboardOverview } from "@/types/dashboard";
import { EXECUTIVE_COPY } from "@/lib/copy";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

interface ExecutiveDecisionPanelProps {
  overview: DashboardOverview;
  topActions: ActionQueueItem[];
}

export default function ExecutiveDecisionPanel({
  overview,
  topActions,
}: ExecutiveDecisionPanelProps) {
  return (
    <div
      className="executive-panel"
      role="region"
      aria-labelledby="executive-panel-title"
    >
      <div className="executive-panel__header">
        <h3 id="executive-panel-title">{EXECUTIVE_COPY.title}</h3>
        <p>{EXECUTIVE_COPY.desc}</p>
      </div>

      <div className="executive-panel__kpis" role="list" aria-label="Executive KPIs">
        <div className="executive-kpi" role="listitem">
          <span className="executive-kpi__label">Top Risk Game</span>
          <strong>{overview.topRiskGame || "—"}</strong>
        </div>
        <div className="executive-kpi" role="listitem">
          <span className="executive-kpi__label">Top Risk Category</span>
          <strong>{overview.topRiskCategory || "—"}</strong>
        </div>
        <div className="executive-kpi executive-kpi--alert" role="listitem">
          <span className="executive-kpi__label">Critical Issues</span>
          <strong>{overview.criticalIssues ?? 0}</strong>
        </div>
      </div>

      <div className="executive-panel__actions">
        <h4>{EXECUTIVE_COPY.topActions}</h4>
        {!topActions.length ? (
          <EmptyState
            title="우선 액션 없음"
            message="액션 큐가 비어 있어 Executive 액션을 표시할 수 없습니다."
          />
        ) : (
          <ol className="executive-action-list">
            {topActions.map((action, index) => (
              <li key={action.actionId} className="executive-action-item">
                <span className="executive-action-item__rank" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <div className="executive-action-item__meta">
                    <code>{action.actionId}</code>
                    <span>{action.game}</span>
                    <Badge label={action.priority} />
                  </div>
                  <p>{action.action}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
