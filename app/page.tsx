import DashboardClient from "@/components/DashboardClient";

import overviewData from "@/dashboard_data/dashboard_overview.json";
import issueRankingData from "@/dashboard_data/issue_ranking.json";
import actionQueueData from "@/dashboard_data/action_queue.json";
import languagePanelsData from "@/dashboard_data/language_panels.json";

import snapshot0601 from "@/snapshots/2026-06-01/snapshot.json";
import snapshot0608 from "@/snapshots/2026-06-08/snapshot.json";
import snapshot0615 from "@/snapshots/2026-06-15/snapshot.json";

import { ensureArray } from "@/lib/dataGuards";
import { buildLiveOpsIntel } from "@/lib/liveOpsIntel";
import type { ReviewSnapshot } from "@/types/liveOps";
import type {
  DashboardOverview,
  IssueRankingRow,
  ActionQueueItem,
  LanguagePanel,
} from "@/types/dashboard";

const overview = overviewData as DashboardOverview;
const issueRanking = ensureArray(issueRankingData as IssueRankingRow[]);
const actionQueue = ensureArray(actionQueueData as ActionQueueItem[]);
const languagePanels = ensureArray(languagePanelsData as LanguagePanel[]);

const snapshots: ReviewSnapshot[] = [
  snapshot0601 as ReviewSnapshot,
  snapshot0608 as ReviewSnapshot,
  snapshot0615 as ReviewSnapshot,
];

const liveOpsIntel = buildLiveOpsIntel(snapshots, issueRanking, overview);

const NAV_ITEMS = [
  { href: "#changes", label: "변화 감지" },
  { href: "#collection", label: "수집" },
  { href: "#trends", label: "추세" },
  { href: "#alerts", label: "경고" },
  { href: "#risks", label: "우선순위" },
  { href: "#countries", label: "국가" },
  { href: "#briefing", label: "브리핑" },
];

export default function HomePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <header className="site-header site-header--ops">
        <div className="site-header__inner">
          <div className="site-header__brand">
            <span className="site-header__logo" aria-hidden="true">
              GN
            </span>
            <div>
              <strong>GameN Insight</strong>
              <span>글로벌 운영 인텔리전스</span>
            </div>
          </div>
          <nav className="site-nav" aria-label="운영 상황실 섹션">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <DashboardClient
        overview={overview}
        issueRanking={issueRanking}
        actionQueue={actionQueue}
        languagePanels={languagePanels}
        liveOpsIntel={liveOpsIntel}
      />

      <footer className="site-footer">
        <p>
          GameN Insight — 글로벌 게임 운영 의사결정 플랫폼 · 스냅샷 시뮬레이션 ·
          OpenAI API 미사용
        </p>
      </footer>
    </>
  );
}
