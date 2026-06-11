"use client";

import { useMemo, useState } from "react";
import type { LanguagePanel } from "@/types/dashboard";
import { SECTIONS } from "@/lib/copy";
import EmptyState from "./EmptyState";
import SectionHeader from "./SectionHeader";

interface LanguagePanelsProps {
  panels: LanguagePanel[];
}

export default function LanguagePanels({ panels }: LanguagePanelsProps) {
  const { games, regions } = useMemo(() => {
    const gameSet = new Set<string>();
    const regionSet = new Set<string>();
    for (const p of panels) {
      gameSet.add(p.game);
      regionSet.add(p.languageGroup);
    }
    return {
      games: Array.from(gameSet),
      regions: Array.from(regionSet),
    };
  }, [panels]);

  const [selectedGame, setSelectedGame] = useState<string>("all");

  const filtered = useMemo(() => {
    if (selectedGame === "all") return panels;
    return panels.filter((p) => p.game === selectedGame);
  }, [panels, selectedGame]);

  const matrix = useMemo(() => {
    const map = new Map<string, LanguagePanel>();
    for (const p of filtered) {
      map.set(`${p.languageGroup}::${p.game}`, p);
    }
    return map;
  }, [filtered]);

  const displayGames =
    selectedGame === "all" ? games : games.filter((g) => g === selectedGame);

  return (
    <section
      id="languages"
      className="section section--languages"
      aria-labelledby="languages-heading"
    >
      <SectionHeader
        id="languages-heading"
        title={SECTIONS.languages.title}
        description="언어권별 핵심 불만 — 빠른 비교"
      />

      {!panels.length ? (
        <EmptyState
          title="언어권 데이터 없음"
          message="language_panels.json에 표시할 언어권 분석이 없습니다."
        />
      ) : (
        <>
          <div className="lang-filters" role="group" aria-label="게임 필터">
            <button
              type="button"
              className={`lang-filter-btn${selectedGame === "all" ? " lang-filter-btn--active" : ""}`}
              onClick={() => setSelectedGame("all")}
              aria-pressed={selectedGame === "all"}
            >
              전체
            </button>
            {games.map((game) => (
              <button
                key={game}
                type="button"
                className={`lang-filter-btn${selectedGame === game ? " lang-filter-btn--active" : ""}`}
                onClick={() => setSelectedGame(game)}
                aria-pressed={selectedGame === game}
              >
                {game}
              </button>
            ))}
          </div>

          <div className="lang-matrix-wrap">
            <table className="lang-matrix" aria-label="언어권별 불만 비교">
              <thead>
                <tr>
                  <th scope="col">언어권</th>
                  {displayGames.map((game) => (
                    <th key={game} scope="col">
                      {game}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr key={region}>
                    <th scope="row">{region}</th>
                    {displayGames.map((game) => {
                      const panel = matrix.get(`${region}::${game}`);
                      const topComplaint = panel?.mainComplaints?.[0];
                      const intensity =
                        (panel?.mainComplaints?.length ?? 0) >= 3
                          ? "high"
                          : (panel?.mainComplaints?.length ?? 0) >= 2
                            ? "medium"
                            : topComplaint
                              ? "low"
                              : "none";

                      return (
                        <td
                          key={`${region}-${game}`}
                          className={`lang-cell lang-cell--${intensity}`}
                        >
                          {panel ? (
                            <>
                              <span className="lang-cell__count">
                                {panel.reviewCount}
                              </span>
                              <span className="lang-cell__complaint">
                                {topComplaint ?? "—"}
                              </span>
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
