import type { IssueRankingRow } from "@/types/dashboard";
import { rowHighlightClass } from "@/lib/badges";
import { SECTIONS } from "@/lib/copy";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import SectionHeader from "./SectionHeader";

interface IssueRankingProps {
  rows: IssueRankingRow[];
}

const SEVERITY_SCORE: Record<string, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

function RiskMeter({
  label,
  value,
  max = 100,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const level =
    pct >= 75 ? "critical" : pct >= 50 ? "high" : pct >= 30 ? "medium" : "low";

  return (
    <div className="risk-meter">
      <div className="risk-meter__head">
        <span className="risk-meter__label">{label}</span>
        <span className="risk-meter__value">{value}</span>
      </div>
      <div className="risk-meter__track" aria-hidden="true">
        <div
          className={`risk-meter__fill risk-meter__fill--${level}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function IssueCard({ row, maxFreq }: { row: IssueRankingRow; maxFreq: number }) {
  const impactScore = SEVERITY_SCORE[row.impact.toLowerCase()] ?? 25;
  const riskScore = SEVERITY_SCORE[row.businessRisk.toLowerCase()] ?? 25;

  return (
    <article
      className={`issue-card ${rowHighlightClass(row.impact)}`}
      role="listitem"
    >
      <header className="issue-card__head">
        <span className="issue-card__rank">#{row.rank}</span>
        <div className="issue-card__game-meta">
          <strong>{row.game}</strong>
          <code className="category-code">{row.category}</code>
        </div>
        <div className="issue-card__badges">
          <Badge label={row.impact} />
          <Badge label={row.businessRisk} />
        </div>
      </header>

      <h3 className="issue-card__title">{row.issue}</h3>

      <div className="issue-card__meters">
        <RiskMeter label="영향도" value={impactScore} />
        <RiskMeter label="비즈니스 리스크" value={riskScore} />
        <RiskMeter label="빈도" value={row.frequency} max={maxFreq} />
      </div>

      <p className="issue-card__impact">{row.expectedImpact}</p>

      {row.recommendedActions?.[0] && (
        <footer className="issue-card__action">
          <span className="issue-card__action-label">권장 조치</span>
          <p>{row.recommendedActions[0]}</p>
        </footer>
      )}
    </article>
  );
}

export default function IssueRanking({ rows }: IssueRankingProps) {
  const maxFreq = Math.max(...rows.map((r) => r.frequency), 1);

  return (
    <section
      id="issues"
      className="section section--ranking"
      aria-labelledby="ranking-heading"
    >
      <SectionHeader
        id="ranking-heading"
        title={SECTIONS.ranking.title}
        description="위험도 순 이슈 — 무엇이 가장 위험한가"
      />

      {!rows.length ? (
        <EmptyState
          title="이슈 랭킹 없음"
          message="issue_ranking.json에 표시할 운영 이슈가 없습니다."
        />
      ) : (
        <div className="issue-card-grid" role="list" aria-label="이슈 랭킹">
          {rows.map((row) => (
            <IssueCard key={`${row.rank}-${row.game}-${row.category}`} row={row} maxFreq={maxFreq} />
          ))}
        </div>
      )}
    </section>
  );
}
