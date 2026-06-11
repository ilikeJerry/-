import type { TopRiskIssueCard } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";
import EmptyState from "./EmptyState";

interface TopRiskIssuesProps {
  issues: TopRiskIssueCard[];
}

export default function TopRiskIssues({ issues }: TopRiskIssuesProps) {
  const L = PRODUCT_COPY.labels;

  return (
    <section
      id="risks"
      className="ops-section ops-section--risks"
      aria-labelledby="risks-heading"
    >
      <header className="ops-section__head">
        <h2 id="risks-heading">{PRODUCT_COPY.sections.risks.title}</h2>
        <p>{PRODUCT_COPY.sections.risks.desc}</p>
      </header>

      {!issues.length ? (
        <EmptyState title="이슈 없음" message="표시할 운영 이슈가 없습니다." />
      ) : (
        <div className="risk-top5" role="list">
          {issues.map((issue) => (
            <article key={issue.rank} className="risk-top5__card" role="listitem">
              <header className="risk-top5__head">
                <span className="risk-top5__rank">{issue.rank}</span>
                <div>
                  <h3>{issue.title}</h3>
                  <span className="risk-top5__game">{issue.game}</span>
                </div>
                <span className={`risk-badge risk-badge--${issue.riskLevelKo}`}>
                  {issue.riskLevelKo}
                </span>
              </header>

              <dl className="risk-top5__metrics">
                <div>
                  <dt>{L.riskLevel}</dt>
                  <dd>{issue.riskLevelKo}</dd>
                </div>
                <div>
                  <dt>증가율</dt>
                  <dd className={issue.growthRate > 0 ? "risk-top5__up" : issue.growthRate < 0 ? "risk-top5__down" : ""}>
                    {issue.growthRate > 0 ? "+" : ""}
                    {issue.growthRate}%
                  </dd>
                </div>
                <div>
                  <dt>{L.reviewCount}</dt>
                  <dd>{issue.reviewCount}건</dd>
                </div>
              </dl>

              <div className="risk-top5__action">
                <span>{L.recommendedAction}</span>
                <p>{issue.recommendedAction}</p>
              </div>
              <footer className="risk-top5__effect">
                <span>{L.expectedEffect}</span>
                <p>{issue.expectedEffect}</p>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
