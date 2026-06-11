import type { TrendRowKo } from "@/types/opsProduct";
import { PRODUCT_COPY } from "@/lib/copy";
import EmptyState from "./EmptyState";

interface TrendDashboardKoProps {
  rows: TrendRowKo[];
}

export default function TrendDashboardKo({ rows }: TrendDashboardKoProps) {
  const L = PRODUCT_COPY.labels;

  return (
    <section
      id="trends"
      className="ops-section ops-section--trends-ko"
      aria-labelledby="trends-heading"
    >
      <header className="ops-section__head">
        <h2 id="trends-heading">{PRODUCT_COPY.sections.trends.title}</h2>
        <p>{PRODUCT_COPY.sections.trends.desc}</p>
      </header>

      {!rows.length ? (
        <EmptyState title="추세 없음" message="스냅샷 비교 데이터가 없습니다." />
      ) : (
        <div className="trend-ko-table-wrap">
          <table className="trend-ko-table" aria-label="카테고리별 변화량">
            <thead>
              <tr>
                <th scope="col">카테고리</th>
                <th scope="col">{L.lastWeek}</th>
                <th scope="col">{L.thisWeek}</th>
                <th scope="col">{L.changeRate}</th>
                <th scope="col">{L.status}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.category}
                  className={`trend-ko-row trend-ko-row--${row.statusKo}`}
                >
                  <th scope="row">{row.label}</th>
                  <td>{row.previous}건</td>
                  <td>{row.current}건</td>
                  <td
                    className={
                      row.changePercent > 0
                        ? "trend-ko-up"
                        : row.changePercent < 0
                          ? "trend-ko-down"
                          : ""
                    }
                  >
                    {row.changePercent > 0 ? "+" : ""}
                    {row.changePercent}%
                  </td>
                  <td>
                    <span className={`trend-ko-status trend-ko-status--${row.statusKo}`}>
                      {row.statusKo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
