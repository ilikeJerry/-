import type { SeverityLevel } from "@/types/dashboard";
import type { TrendStatus } from "@/types/liveOps";

/** 게임명 제외 UI 전체 한국어 통일 */

const ISSUE_KO: Record<string, string> = {
  "Matchmaking & Ranked Integrity": "매칭·랭크 무결성",
  "Monetization & Pricing": "과금·가격 정책",
  "Server Stability & Netcode": "서버 안정성·네트코드",
  "Balance & Combat Fairness": "밸런스·전투 공정성",
  "Client Performance & Stability": "클라이언트 성능·안정성",
  "Content Depth & Live Ops": "콘텐츠·라이브옵스",
  "Community & Player Experience": "커뮤니티·플레이어 경험",
  "Toxicity & Fair Play": "유해 행위·페어플레이",
  "UI/UX & Controls": "UI/UX·조작감",
  "No dominant categorized complaint": "지배적 불만 없음",
};

const POSITIVE_KO: Record<string, string> = {
  "Fun And Casual Enjoyment": "캐주얼 재미",
  "Free Access And Value": "무료 접근·가치",
  "Friends And Social Play": "친구·소셜 플레이",
  "Character And Content Variety": "캐릭터·콘텐츠 다양성",
  "Among Us Style Social Deduction": "소셜 디덕션 재미",
  "Social fun": "소셜 재미",
  Accessibility: "접근성",
};

const CATEGORY_KO: Record<string, string> = {
  matchmaking: "매칭 품질",
  monetization: "과금 불만",
  server: "서버 이슈",
  balance: "밸런스",
  performance: "클라이언트 성능",
  content: "콘텐츠 운영",
  community: "커뮤니티 경험",
  toxicity: "유해 행위",
  translation: "현지화·번역",
  tutorial: "온보딩",
  uiux: "UI/UX",
};

const REGION_KO: Record<string, string> = {
  brazil_portuguese: "브라질",
  spanish: "스페인어권",
  english: "영어권",
};

const EFFECT_KO: Record<string, string> = {
  "Restored competitive fairness perception and reduced ranked abandonment.":
    "경쟁 공정성 인식 회복 및 랭크 이탈 감소",
  "Lower pay-to-win perception, improved ARPPU/LTV balance, and fewer monetization-driven negative reviews.":
    "과금 피로 완화 및 부정 리뷰 감소",
  "Reduced session frustration, improved ranked trust, and lower churn among competitive players.":
    "세션 불만 감소 및 경쟁 유저 이탈 방지",
};

export function koIssue(text: string): string {
  return ISSUE_KO[text] ?? text;
}

export function koPositive(text: string): string {
  return POSITIVE_KO[text] ?? text;
}

export function koCategory(key: string): string {
  return CATEGORY_KO[key] ?? key;
}

export function koRegion(key: string): string {
  return REGION_KO[key] ?? key;
}

export function koSeverity(level: SeverityLevel | string): string {
  const m: Record<string, string> = {
    Critical: "위험",
    High: "높음",
    Medium: "중간",
    Low: "낮음",
  };
  return m[level] ?? level;
}

export function koTrendStatus(status: TrendStatus): string {
  if (status === "Rising") return "악화";
  if (status === "Improving") return "개선";
  return "유지";
}

export function koAlertLevel(
  priority: "Critical" | "High" | "Medium",
): "위험" | "주의" | "관찰" {
  if (priority === "Critical") return "위험";
  if (priority === "High") return "주의";
  return "관찰";
}

export function koEffect(text: string): string {
  if (EFFECT_KO[text]) return EFFECT_KO[text];
  if (text.includes("fairness") || text.includes("ranked"))
    return "신규 유저 유지율 개선";
  if (text.includes("monetization") || text.includes("pay"))
    return "결제 전환율 개선";
  if (text.includes("churn") || text.includes("frustration"))
    return "부정 리뷰 감소";
  if (text.includes("community"))
    return "커뮤니티 만족도 향상";
  return "운영 리스크 완화 및 유저 만족도 개선";
}

export function koAction(text: string): string {
  const map: [RegExp, string][] = [
    [/Audit MMR/i, "MMR/Elo 범위 점검"],
    [/smurf-detection/i, "스머프 탐지·신고 피드백 강화"],
    [/rank disparity/i, "솔로 랭크 매칭 격차 제한"],
    [/patch notes/i, "패치 노트에 매칭 정책 공지"],
    [/price ladders/i, "지역별 가격 정책 검토"],
    [/drop rates/i, "확률 공개 및 과금 구조 개선"],
    [/packet loss/i, "패킷 손실·연결 끊김 모니터링"],
    [/usability tests/i, "UI/UX 사용성 테스트"],
    [/crash and freeze/i, "크래시·프리즈 클러스터 분석"],
    [/rotating events/i, "로테이션 이벤트·모드 확대"],
  ];
  for (const [re, ko] of map) {
    if (re.test(text)) return ko;
  }
  return text.length > 60 ? `${text.slice(0, 58)}…` : text;
}
