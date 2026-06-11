"use client";

import { useState } from "react";
import { COPILOT_COPY, SECTIONS } from "@/lib/copy";
import { COPILOT_QUESTIONS, generateCopilotAnswer } from "@/lib/copilot";
import type {
  CopilotAnswer,
  DashboardOverview,
  GameCard,
  GameInsightSummary,
  IssueRankingRow,
} from "@/types/dashboard";
import EmptyState from "./EmptyState";

interface OperatorCopilotProps {
  overview: DashboardOverview;
  issues: IssueRankingRow[];
  gameCards: GameCard[];
  insights: GameInsightSummary[];
}

export default function OperatorCopilot({
  overview,
  issues,
  gameCards,
  insights,
}: OperatorCopilotProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<CopilotAnswer | null>(null);

  const handleQuestion = (id: string) => {
    setActiveId(id);
    setAnswer(
      generateCopilotAnswer(id, { overview, issues, gameCards, insights }),
    );
  };

  const canAnswer = issues.length > 0 && gameCards.length > 0;

  return (
    <details id="copilot" className="copilot-collapsible section--copilot">
      <summary className="copilot-collapsible__trigger">
        <span>{SECTIONS.copilot.title}</span>
        <span className="copilot-collapsible__hint">심화 질문 (선택)</span>
      </summary>

      {!canAnswer ? (
        <EmptyState
          title="코파일럿 데이터 부족"
          message="이슈 랭킹 또는 게임 카드 데이터가 없어 답변을 생성할 수 없습니다."
        />
      ) : (
        <div className="copilot-layout">
          <div
            className="copilot-questions"
            role="group"
            aria-label={COPILOT_COPY.questionsLabel}
          >
            <span className="copilot-questions__label">{COPILOT_COPY.questionsLabel}</span>
            {COPILOT_QUESTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                className={`copilot-question-btn${
                  activeId === q.id ? " copilot-question-btn--active" : ""
                }`}
                aria-label={`질문: ${q.label}`}
                aria-pressed={activeId === q.id}
                onClick={() => handleQuestion(q.id)}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="copilot-answer" aria-live="polite">
            {!answer ? (
              <div className="copilot-answer__placeholder">
                <p className="copilot-answer__placeholder-title">
                  {COPILOT_COPY.placeholderTitle}
                </p>
                <p>{COPILOT_COPY.placeholder}</p>
              </div>
            ) : (
              <article className="copilot-answer-card" aria-label={answer.title}>
                <span className="copilot-answer-card__tag">Copilot Insight</span>
                <h3>{answer.title}</h3>
                <p className="copilot-answer-card__summary">{answer.summary}</p>
                <div className="copilot-answer-card__block">
                  <h4>Recommended Decision</h4>
                  <p>{answer.recommendation}</p>
                </div>
                {answer.evidence.length > 0 && (
                  <div className="copilot-answer-card__block">
                    <h4>Evidence</h4>
                    <ul>
                      {answer.evidence.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            )}
          </div>
        </div>
      )}
    </details>
  );
}
