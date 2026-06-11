import type { ReviewSnapshot, CategoryTrendRow } from "@/types/liveOps";
import type { IssueRankingRow } from "@/types/dashboard";
import {
  categoryDisplayName,
  percentChange,
  trendStatus,
  TREND_CATEGORIES,
  LANGUAGE_DISPLAY,
} from "@/lib/categories";

export function sortSnapshots(snapshots: ReviewSnapshot[]): ReviewSnapshot[] {
  return [...snapshots].sort((a, b) =>
    a.snapshotDate.localeCompare(b.snapshotDate),
  );
}

export function compareSnapshots(
  previous: ReviewSnapshot,
  current: ReviewSnapshot,
  categoryKeys: string[],
): CategoryTrendRow[] {
  return categoryKeys.map((key) => {
    const prev = previous.categories[key] ?? 0;
    const cur = current.categories[key] ?? 0;
    const change = percentChange(prev, cur);
    return {
      category: key,
      displayName: categoryDisplayName(key),
      previousSnapshot: prev,
      currentSnapshot: cur,
      changePercent: change,
      status: trendStatus(change),
    };
  });
}

export function compareLanguageRegions(
  previous: ReviewSnapshot,
  current: ReviewSnapshot,
): CategoryTrendRow[] {
  const keys = Array.from(
    new Set([
      ...Object.keys(previous.languageRegions ?? {}),
      ...Object.keys(current.languageRegions ?? {}),
    ]),
  );
  return keys.map((key) => {
    const prev = previous.languageRegions[key] ?? 0;
    const cur = current.languageRegions[key] ?? 0;
    const change = percentChange(prev, cur);
    return {
      category: key,
      displayName: `${LANGUAGE_DISPLAY[key] ?? key} complaints`,
      previousSnapshot: prev,
      currentSnapshot: cur,
      changePercent: change,
      status: trendStatus(change),
    };
  });
}

export function aggregateCategoriesFromRanking(
  rows: IssueRankingRow[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.category] = (totals[row.category] ?? 0) + row.frequency;
  }
  return totals;
}

export function validateSnapshotChain(snapshots: ReviewSnapshot[]): boolean {
  return snapshots.length >= 2;
}

export function getTrendCategoryKeys(
  snapshots: ReviewSnapshot[],
): string[] {
  const keySet = new Set<string>(TREND_CATEGORIES);
  for (const snap of snapshots) {
    Object.keys(snap.categories).forEach((k) => keySet.add(k));
  }
  return Array.from(keySet).filter((k) =>
    TREND_CATEGORIES.includes(k as (typeof TREND_CATEGORIES)[number]),
  );
}
