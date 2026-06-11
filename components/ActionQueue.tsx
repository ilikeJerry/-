"use client";

import { useMemo, useState } from "react";
import type {
  ActionWithWorkflow,
  ActionWorkflowStatus,
  SeverityLevel,
} from "@/types/dashboard";
import Badge from "./Badge";
import { rowHighlightClass } from "@/lib/badges";
import { SECTIONS } from "@/lib/copy";
import { countWorkflowByStatus } from "@/lib/operations";
import EmptyState from "./EmptyState";
import SectionHeader from "./SectionHeader";

interface ActionQueueProps {
  items: ActionWithWorkflow[];
  selectedId: string | null;
  onSelect: (actionId: string) => void;
  onStatusChange: (actionId: string, status: ActionWorkflowStatus) => void;
}

type PriorityFilter = "critical-high" | "all";

const STATUS_OPTIONS: ActionWorkflowStatus[] = [
  "pending",
  "in_review",
  "done",
];

const STATUS_LABELS: Record<ActionWorkflowStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  done: "Done",
};

const HIGH_PRIORITY: SeverityLevel[] = ["Critical", "High"];

function isHighPriority(priority: string): boolean {
  return HIGH_PRIORITY.includes(priority as SeverityLevel);
}

export default function ActionQueue({
  items,
  selectedId,
  onSelect,
  onStatusChange,
}: ActionQueueProps) {
  const [filter, setFilter] = useState<PriorityFilter>("critical-high");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => isHighPriority(item.priority));
  }, [items, filter]);

  const hiddenCount = items.length - filtered.length;
  const counts = countWorkflowByStatus(filtered);

  return (
    <section id="actions" className="section" aria-labelledby="actions-heading">
      <SectionHeader
        id="actions-heading"
        title={SECTIONS.actions.title}
        description="Critical · High 우선 — 나머지는 필터로 확인"
      />

      <div className="action-filters" role="group" aria-label="우선순위 필터">
        <button
          type="button"
          className={`action-filter-btn${filter === "critical-high" ? " action-filter-btn--active" : ""}`}
          onClick={() => setFilter("critical-high")}
          aria-pressed={filter === "critical-high"}
        >
          Critical + High
          <span className="action-filter-btn__count">
            {items.filter((i) => isHighPriority(i.priority)).length}
          </span>
        </button>
        <button
          type="button"
          className={`action-filter-btn${filter === "all" ? " action-filter-btn--active" : ""}`}
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
        >
          전체
          <span className="action-filter-btn__count">{items.length}</span>
        </button>
        {filter === "critical-high" && hiddenCount > 0 && (
          <span className="action-filter-hint">
            {hiddenCount}개 Medium/Low 숨김
          </span>
        )}
      </div>

      <div className="workflow-stats" aria-label="Workflow status counts">
        <span className="workflow-stat workflow-stat--pending">
          Pending <strong>{counts.pending}</strong>
        </span>
        <span className="workflow-stat workflow-stat--review">
          In Review <strong>{counts.in_review}</strong>
        </span>
        <span className="workflow-stat workflow-stat--done">
          Done <strong>{counts.done}</strong>
        </span>
      </div>

      {!filtered.length ? (
        <EmptyState
          title="표시할 액션 없음"
          message={
            filter === "critical-high"
              ? "Critical/High 액션이 없습니다. '전체' 필터를 사용하세요."
              : "action_queue.json에 실행할 운영 액션이 없습니다."
          }
        />
      ) : (
        <div className="action-card-list" role="list" aria-label="운영 액션 큐">
          {filtered.map((item) => (
            <article
              key={item.actionId}
              className={[
                "action-card",
                rowHighlightClass(item.priority),
                selectedId === item.actionId ? "action-card--selected" : "",
                item.workflowStatus === "done" ? "action-card--done" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              role="listitem"
            >
              <button
                type="button"
                className="action-card__main"
                onClick={() => onSelect(item.actionId)}
                aria-label={`${item.actionId} ${item.game} — ${item.action}`}
                aria-pressed={selectedId === item.actionId}
              >
                <header className="action-card__head">
                  <code>{item.actionId}</code>
                  <Badge label={item.priority} />
                </header>
                <p className="action-card__game">{item.game}</p>
                <p className="action-card__text">{item.action}</p>
              </button>
              <label className="action-card__workflow">
                <span>Status</span>
                <select
                  className={`workflow-select workflow-select--${item.workflowStatus}`}
                  value={item.workflowStatus}
                  aria-label={`Workflow status for ${item.actionId}`}
                  onChange={(e) =>
                    onStatusChange(
                      item.actionId,
                      e.target.value as ActionWorkflowStatus,
                    )
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
