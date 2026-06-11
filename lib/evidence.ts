import type { EvidenceItem } from "@/types/dashboard";
import type { DashboardOverview } from "@/types/dashboard";

export function buildEvidenceItems(
  overview: DashboardOverview | null,
  actionCount: number,
): EvidenceItem[] {
  if (!overview) {
    return [];
  }

  return [
    { label: "수집 데이터", value: `Steam 리뷰 ${overview.totalReviews.toLocaleString()}개` },
    { label: "비교 게임", value: `${overview.totalGames}개 글로벌 게임` },
    {
      label: "리뷰 구성",
      value: `Negative ${overview.negativeReviews.toLocaleString()} / Positive ${overview.positiveReviews.toLocaleString()}`,
    },
    { label: "운영 카테고리", value: "13개 (balance, server, monetization 등)" },
    { label: "생성 액션", value: `${actionCount}개 운영 액션` },
    {
      label: "Snapshot 시스템",
      value: "2026-06-01 / 06-08 / 06-15 시뮬레이션 비교",
    },
    {
      label: "인사이트 엔진",
      value: "OpenAI API 미사용 · 룰 기반 추세·알림 엔진",
    },
  ];
}
