import type { ExecutionPriorityItem } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";
import EmptyState from "./EmptyState";

interface ExecutionPriorityCenterProps {
  items: ExecutionPriorityItem[];
}

export default function ExecutionPriorityCenter({
  items,
}: ExecutionPriorityCenterProps) {
  return (
    <section
      id="priorities"
      className="ops-section ops-section--priorities"
      aria-labelledby="priorities-heading"
    >
      <header className="ops-section__head">
        <h2 id="priorities-heading">{PRODUCT_COPY.sections.priorities.title}</h2>
        <p>{PRODUCT_COPY.sections.priorities.desc}</p>
      </header>

      {!items.length ? (
        <EmptyState title="실행 항목 없음" message="우선순위 액션이 없습니다." />
      ) : (
        <ol className="priority-list">
          {items.map((item) => (
            <li key={item.actionId} className="priority-item">
              <div className="priority-item__rank">{item.rank}순위</div>
              <div className="priority-item__body">
                <h3>{item.title}</h3>
                <span className="priority-item__game">{item.game}</span>
                <dl className="priority-item__meta">
                  <div>
                    <dt>예상 효과</dt>
                    <dd>{item.expectedEffect}</dd>
                  </div>
                  <div>
                    <dt>영향도</dt>
                    <dd>{item.impactLevel}</dd>
                  </div>
                  <div>
                    <dt>소요 시간</dt>
                    <dd>{item.effortLevel}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
