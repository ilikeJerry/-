/** GameN Insight — 글로벌 게임 운영 의사결정 플랫폼 */

export const PRODUCT_COPY = {
  platform: {
    title: "글로벌 운영 상황실",
    subtitle:
      "국가별 유저 반응·언어별 불만·결제 이슈·운영 리스크 변화를 감지하고 실행 우선순위를 제안합니다.",
    tagline: "AI 기반 운영 인텔리전스",
  },
  sections: {
    changes: {
      title: "운영 변화 감지 센터",
      desc: "운영자가 가장 먼저 확인하는 영역 — 변화량 중심",
    },
    collection: {
      title: "데이터 수집 현황",
      desc: "스냅샷 기반 정기 수집 이력",
    },
    trends: {
      title: "변화량 추세 분석",
      desc: "지난주 대비 이번주 — 증가율과 상태",
    },
    alerts: {
      title: "운영 경고",
      desc: "증가율 30% 이상 · 위험 등급 · 신규 이슈 자동 감지",
    },
    status: {
      title: "현재 서비스 상태",
      desc: "정상 · 주의 · 위험 자동 판정",
    },
    risks: {
      title: "Top 5 운영 우선순위",
      desc: "지금 당장 처리해야 할 문제만",
    },
    countries: {
      title: "국가별 운영 현황",
      desc: "브라질 · 인도 · 베트남 · 영어권 · 스페인어권",
    },
    priorities: {
      title: "실행 우선순위",
      desc: "운영자가 실제로 해야 하는 일",
    },
    briefing: {
      title: "운영 브리핑 센터",
      desc: "자동 생성 브리핑 — 즉시 공유 가능",
    },
  },
  labels: {
    fastestUp: "이번 주 가장 빠르게 증가한 문제",
    fastestDown: "이번 주 가장 빠르게 감소한 문제",
    newRisks: "신규 위험 신호",
    recommended: "추천 운영 우선순위",
    lastCollected: "최근 수집",
    schedule: "수집 주기",
    totalReviews: "누적 리뷰",
    nextCollection: "다음 수집 예정",
    lastWeek: "지난주",
    thisWeek: "이번주",
    changeRate: "증가율",
    status: "상태",
    reason: "발생 이유",
    impactScope: "영향 범위",
    recommendedAction: "권장 조치",
    riskLevel: "위험도",
    reviewCount: "영향 리뷰 수",
    expectedEffect: "예상 효과",
    growingIssue: "증가 중인 문제",
    opsMemo: "운영 메모",
    positive: "주요 긍정 요소",
    complaint: "주요 불만",
    impact: "영향",
    whyImportant: "위험 이유",
  },
} as const;

/** @deprecated 레거시 컴포넌트 호환 */
export const SECTIONS = {
  whatChanged: { title: "운영 변화 감지", desc: "" },
  trends: { title: "변화량 추세", desc: "" },
  evidence: { title: "프로젝트 근거", desc: "" },
  copilot: { title: "운영 브리핑", desc: "" },
  games: { title: "게임 리스크", desc: "" },
  decision: { title: "운영 현황", desc: "" },
  ranking: { title: "운영 이슈", desc: "" },
  actions: { title: "실행 대기열", desc: "" },
  languages: { title: "국가별 비교", desc: "" },
  story: { title: "프로젝트 소개", desc: "" },
} as const;

export const EXECUTIVE_COPY = {
  title: "운영 현황",
  desc: "",
  topActions: "가장 먼저 처리할 과제 3개",
} as const;

export const COPILOT_COPY = {
  questionsLabel: "운영자 질문",
  placeholderTitle: "질문을 선택하세요",
  placeholder: "",
  placeholderNote: "",
} as const;
