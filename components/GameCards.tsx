import type { GameCard } from "@/types/dashboard";
import { cardRiskClass } from "@/lib/badges";
import { SECTIONS } from "@/lib/copy";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import SectionHeader from "./SectionHeader";

interface GameCardsProps {
  cards: GameCard[];
}

export default function GameCards({ cards }: GameCardsProps) {
  return (
    <section id="games" className="section section--games-compact" aria-labelledby="games-heading">
      <SectionHeader
        id="games-heading"
        title={SECTIONS.games.title}
        description="타이틀별 핵심 리스크 스냅샷"
      />

      {!cards.length ? (
        <EmptyState
          title="게임 카드 없음"
          message="game_cards.json에 표시할 게임 데이터가 없습니다."
        />
      ) : (
        <div className="game-snapshot-grid" role="list" aria-label="게임 리스크 스냅샷">
          {cards.map((card) => (
            <article
              key={card.game}
              className={`game-snapshot ${cardRiskClass(card.riskLevel)}`}
              role="listitem"
            >
              <header className="game-snapshot__head">
                <h3>{card.game}</h3>
                <Badge label={card.riskLevel} />
              </header>
              <p className="game-snapshot__issue">{card.mainIssue}</p>
              <footer className="game-snapshot__focus">
                <span>Focus</span>
                <p>{card.recommendedFocus}</p>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
