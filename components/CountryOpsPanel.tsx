import type { CountryOpsProfile } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";
import EmptyState from "./EmptyState";

interface CountryOpsPanelProps {
  countries: CountryOpsProfile[];
}

function riskClass(level: CountryOpsProfile["riskLevel"]) {
  if (level === "위험") return "country-card country-card--danger";
  if (level === "주의") return "country-card country-card--warn";
  return "country-card country-card--ok";
}

export default function CountryOpsPanel({ countries }: CountryOpsPanelProps) {
  const L = PRODUCT_COPY.labels;

  return (
    <section
      id="countries"
      className="ops-section ops-section--countries"
      aria-labelledby="countries-heading"
    >
      <header className="ops-section__head">
        <h2 id="countries-heading">{PRODUCT_COPY.sections.countries.title}</h2>
        <p>{PRODUCT_COPY.sections.countries.desc}</p>
      </header>

      {!countries.length ? (
        <EmptyState title="국가 데이터 없음" message="언어권 분석 데이터가 없습니다." />
      ) : (
        <div className="country-grid" role="list">
          {countries.map((country) => (
            <article
              key={country.id}
              className={riskClass(country.riskLevel)}
              role="listitem"
            >
              <header className="country-card__head">
                <h3>{country.region}</h3>
                <span className={`country-card__risk country-card__risk--${country.riskLevel}`}>
                  {country.riskLevel}
                </span>
              </header>

              <dl className="country-card__fields">
                <div>
                  <dt>{L.complaint}</dt>
                  <dd>{country.topComplaint}</dd>
                </div>
                <div>
                  <dt>{L.positive}</dt>
                  <dd>{country.positiveSignal}</dd>
                </div>
                <div>
                  <dt>{L.growingIssue}</dt>
                  <dd className="country-card__growing">{country.growingIssue}</dd>
                </div>
                <div>
                  <dt>{L.recommendedAction}</dt>
                  <dd>{country.recommendedAction}</dd>
                </div>
                <div>
                  <dt>{L.opsMemo}</dt>
                  <dd className="country-card__caution">{country.opsMemo}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
