import type { OpsBriefingContent } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";

interface OpsBriefingProps {
  briefing: OpsBriefingContent;
}

export default function OpsBriefing({ briefing }: OpsBriefingProps) {
  const L = PRODUCT_COPY.labels;

  return (
    <section
      id="briefing"
      className="ops-section ops-section--briefing"
      aria-labelledby="briefing-heading"
    >
      <header className="ops-section__head">
        <h2 id="briefing-heading">{PRODUCT_COPY.sections.briefing.title}</h2>
        <p>{PRODUCT_COPY.sections.briefing.desc}</p>
      </header>

      <article className="briefing-card" aria-label={briefing.headline}>
        <p className="briefing-card__period">{briefing.periodLabel}</p>
        <h3 className="briefing-card__headline">{briefing.headline}</h3>

        <dl className="briefing-card__blocks">
          <div className="briefing-block briefing-block--risk">
            <dt>오늘 가장 위험한 문제</dt>
            <dd>{briefing.topRisk}</dd>
          </div>
          <div className="briefing-block">
            <dt>{L.whyImportant}</dt>
            <dd>{briefing.whyItMatters}</dd>
          </div>
          <div className="briefing-block">
            <dt>{L.impact}</dt>
            <dd>{briefing.impact}</dd>
          </div>
          <div className="briefing-block briefing-block--action">
            <dt>{L.recommendedAction}</dt>
            <dd>{briefing.recommendedAction}</dd>
          </div>
          <div className="briefing-block briefing-block--full">
            <dt>{L.expectedEffect}</dt>
            <dd>{briefing.expectedEffect}</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}
