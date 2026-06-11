"use client";

import type { PortfolioStory } from "@/types/dashboard";
import { SECTIONS } from "@/lib/copy";
import EmptyState from "./EmptyState";

interface PortfolioStoryProps {
  story: PortfolioStory | null;
}

export default function PortfolioStory({ story }: PortfolioStoryProps) {
  return (
    <details id="story" className="story-collapsible section--story">
      <summary className="story-collapsible__trigger">
        <span>{SECTIONS.story.title}</span>
        <span className="story-collapsible__hint">프로젝트 배경 (선택)</span>
      </summary>

      {!story ? (
        <EmptyState
          title="스토리 데이터 없음"
          message="portfolio_story.json을 불러올 수 없습니다."
        />
      ) : (
        <div className="story-compact">
          <p className="story-compact__lead">{story.value}</p>
          <dl className="story-compact__list">
            <div>
              <dt>Problem</dt>
              <dd>{story.problem}</dd>
            </div>
            <div>
              <dt>Solution</dt>
              <dd>{story.solution}</dd>
            </div>
            <div>
              <dt>GameN</dt>
              <dd>{story.connectionToGameN}</dd>
            </div>
          </dl>
        </div>
      )}
    </details>
  );
}
