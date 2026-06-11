"use client";

import type { ActionWithWorkflow, IssueRankingRow } from "@/types/dashboard";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

interface ActionImpactPanelProps {
  action: ActionWithWorkflow | null;
  linkedIssue: IssueRankingRow | undefined;
  onClose: () => void;
}

export default function ActionImpactPanel({
  action,
  linkedIssue,
  onClose,
}: ActionImpactPanelProps) {
  if (!action) {
    return (
      <aside
        className="impact-panel impact-panel--empty"
        aria-label="Action impact detail"
      >
        <h3>Action Impact View</h3>
        <EmptyState
          title="액션 미선택"
          message="Action Queue에서 항목을 선택하면 Issue · Reason · Expected Impact가 표시됩니다."
        />
      </aside>
    );
  }

  return (
    <aside className="impact-panel" aria-label={`Action impact for ${action.actionId}`}>
      <header className="impact-panel__header">
        <div>
          <h3>Action Impact View</h3>
          <code>{action.actionId}</code>
        </div>
        <button
          type="button"
          className="impact-panel__close"
          onClick={onClose}
          aria-label="Close action impact panel"
        >
          Close
        </button>
      </header>

      <div className="impact-panel__meta">
        <Badge label={action.priority} />
        <span>{action.game}</span>
        <code className="category-code">{action.category}</code>
      </div>

      <p className="impact-panel__action-text">{action.action}</p>

      <div className="impact-panel__block">
        <h4>Issue</h4>
        <p>
          {linkedIssue?.issue ??
            `${action.category} — linked issue not found in ranking`}
        </p>
        {linkedIssue && (
          <span className="impact-panel__sub">
            Frequency {linkedIssue.frequency} · Impact {linkedIssue.impact} ·
            Risk {linkedIssue.businessRisk}
          </span>
        )}
      </div>

      <div className="impact-panel__block">
        <h4>Reason</h4>
        <p>{action.reason}</p>
      </div>

      <div className="impact-panel__block">
        <h4>Expected Impact</h4>
        <p>{action.expectedImpact}</p>
      </div>

      {linkedIssue?.recommendedActions?.length ? (
        <div className="impact-panel__block">
          <h4>Related Actions</h4>
          <ul>
            {linkedIssue.recommendedActions.slice(0, 3).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
