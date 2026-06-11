import type {
  CopilotAnswer,
  CopilotQuestion,
  DashboardOverview,
  GameCard,
  GameInsightSummary,
  IssueRankingRow,
} from "@/types/dashboard";
import { getHighestBusinessRiskIssue } from "@/lib/operations";

export const COPILOT_QUESTIONS: CopilotQuestion[] = [
  { id: "top_risk", label: "가장 위험한 문제는?" },
  { id: "game_priority", label: "어떤 게임을 먼저 대응해야 하는가?" },
  { id: "business_risk", label: "어떤 이슈가 가장 큰 비즈니스 리스크인가?" },
];

interface CopilotContext {
  overview: DashboardOverview;
  issues: IssueRankingRow[];
  gameCards: GameCard[];
  insights: GameInsightSummary[];
}

export function generateCopilotAnswer(
  questionId: string,
  ctx: CopilotContext,
): CopilotAnswer | null {
  switch (questionId) {
    case "top_risk":
      return answerTopRisk(ctx);
    case "game_priority":
      return answerGamePriority(ctx);
    case "business_risk":
      return answerBusinessRisk(ctx);
    default:
      return null;
  }
}

function answerTopRisk(ctx: CopilotContext): CopilotAnswer {
  const top = ctx.issues[0];
  const insightLine = ctx.insights[0]?.executiveSummary?.[1] ?? "";

  return {
    title: "최우선 운영 리스크",
    summary: top
      ? `현재 가장 위험한 운영 이슈는 「${top.issue}」(${top.game})입니다. ${top.frequency}건의 리뷰 신호, ${top.impact} 영향도, ${top.businessRisk} 비즈니스 리스크가 확인되었습니다.`
      : "이슈 랭킹 데이터가 없습니다.",
    recommendation: top
      ? `${top.game} — ${top.category} 카테고리에 대한 즉시 대응 워크순위를 열고, ${top.recommendedActions[0] ?? "운영 액션"}부터 실행하세요.`
      : "이슈 데이터를 갱신한 뒤 다시 분석하세요.",
    evidence: [
      insightLine,
      top?.expectedImpact ?? "",
      `Portfolio top risk category: ${ctx.overview.topRiskCategory}`,
    ].filter(Boolean),
  };
}

function answerGamePriority(ctx: CopilotContext): CopilotAnswer {
  const game =
    ctx.gameCards.find((c) => c.game === ctx.overview.topRiskGame) ??
    ctx.gameCards[0];
  const summaries = ctx.insights
    .filter((i) => i.game === ctx.overview.topRiskGame)
    .flatMap((i) => i.executiveSummary.slice(0, 2));

  return {
    title: "게임 대응 우선순위",
    summary: game
      ? `먼저 대응해야 할 게임은 「${game.game}」입니다. 주요 이슈: ${game.mainIssue} (${game.mainIssueFrequency} mentions), Risk ${game.riskLevel}.`
      : `먼저 대응할 게임: ${ctx.overview.topRiskGame}`,
    recommendation: game
      ? `Recommended focus: ${game.recommendedFocus}`
      : "게임 카드 데이터를 확인하세요.",
    evidence: [
      ...summaries,
      `Total reviews monitored: ${ctx.overview.totalReviews.toLocaleString()}`,
      `Critical issues across portfolio: ${ctx.overview.criticalIssues}`,
    ].filter(Boolean),
  };
}

function answerBusinessRisk(ctx: CopilotContext): CopilotAnswer {
  const top = getHighestBusinessRiskIssue(ctx.issues);

  return {
    title: "비즈니스 리스크 최상위 이슈",
    summary: top
      ? `비즈니스 리스크 관점 1순위는 「${top.issue}」(${top.game}) — Business Risk ${top.businessRisk}, Impact ${top.impact}, Frequency ${top.frequency}.`
      : "비즈니스 리스크 데이터 없음",
    recommendation: top
      ? `수익·이탈·브랜드 리스크를 동시에 줄이려면: ${top.recommendedActions[0] ?? "카테고리별 액션 플랜 수립"}`
      : "",
    evidence: [
      top?.expectedImpact ?? "",
      `Global top risk category (overview): ${ctx.overview.topRiskCategory}`,
      `High-risk action backlog: ${ctx.overview.highRiskActions} items`,
    ].filter(Boolean),
  };
}
