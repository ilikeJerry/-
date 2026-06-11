#!/usr/bin/env python3
"""insights JSON을 GameN Insight 대시보드 UI 전용 JSON으로 변환한다."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
INSIGHTS_DIR = ROOT / "insights"
OUTPUT_DIR = ROOT / "dashboard_data"

GAME_SLUGS = ["brawlhalla", "stumble_guys", "goose_goose_duck"]

IMPACT_RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1}
RISK_RANK = {"high": 3, "medium": 2, "low": 1}

LANGUAGE_GROUP_LABELS = {
    "english": "English",
    "brazil_portuguese": "Brazil/Portuguese",
    "spanish": "Spanish",
}

PORTFOLIO_STORY = {
    "problem": (
        "글로벌 게임 서비스에서는 국가·언어권별 리뷰가 빠르게 누적되지만, "
        "운영자가 모든 피드백을 직접 읽고 우선순위를 정하기 어렵다."
    ),
    "approach": (
        "Steam 공개 리뷰 2,100개를 수집하고, 게임별·언어권별 운영 이슈를 "
        "구조화하였다."
    ),
    "solution": (
        "리뷰를 운영 카테고리로 분류하고, 빈도·영향도·비즈니스 리스크 기준으로 "
        "액션 우선순위를 산출하는 운영 인텔리전스 데이터를 생성하였다."
    ),
    "value": (
        "운영자는 감정 분석 결과가 아니라, 어떤 문제를 먼저 해결해야 하는지와 "
        "예상 효과를 확인할 수 있다."
    ),
    "connectionToGameN": (
        "게임엔의 글로벌 리뉴얼, 다국어 지원, 글로벌 결제 확대 흐름을 분석하여 "
        "글로벌 운영 복잡도를 줄이는 의사결정 지원 시스템으로 설계하였다."
    ),
}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def normalize_impact(impact: str) -> str:
    return (impact or "low").strip().lower()


def normalize_risk(risk: str) -> str:
    return (risk or "low").strip().lower()


def impact_label(impact: str) -> str:
    mapping = {
        "critical": "Critical",
        "high": "High",
        "medium": "Medium",
        "low": "Low",
    }
    return mapping.get(normalize_impact(impact), "Low")


def risk_label(risk: str) -> str:
    mapping = {"high": "High", "medium": "Medium", "low": "Low"}
    return mapping.get(normalize_risk(risk), "Low")


def load_all_insights() -> list[dict[str, Any]]:
    insights: list[dict[str, Any]] = []
    for slug in GAME_SLUGS:
        path = INSIGHTS_DIR / f"{slug}_insights.json"
        insights.append(load_json(path))
    return insights


def pick_top_risk_game(insights: list[dict[str, Any]]) -> str:
    best_game = insights[0]["game"]
    best_score = -1
    for item in insights:
        top = item["topIssues"][0] if item.get("topIssues") else {}
        score = (
            IMPACT_RANK.get(normalize_impact(top.get("impact", "")), 0) * 100
            + RISK_RANK.get(normalize_risk(top.get("businessRisk", "")), 0) * 10
            + int(top.get("frequency", 0))
        )
        if score > best_score:
            best_score = score
            best_game = item["game"]
    return best_game


def pick_top_risk_category(insights: list[dict[str, Any]]) -> str:
    counter: dict[str, int] = {}
    for item in insights:
        for issue in item.get("topIssues", []):
            if normalize_impact(issue.get("impact", "")) in ("critical", "high"):
                cat = issue.get("title") or issue.get("category", "other")
                counter[cat] = counter.get(cat, 0) + int(issue.get("frequency", 0))
    if not counter:
        return "N/A"
    return max(counter.items(), key=lambda x: x[1])[0]


def build_dashboard_overview(insights: list[dict[str, Any]]) -> dict[str, Any]:
    total_reviews = sum(i.get("totalReviewsAnalyzed", 0) for i in insights)
    negative = sum(i.get("negativeReviewCount", 0) for i in insights)
    positive = sum(i.get("positiveReviewCount", 0) for i in insights)

    critical_issues = 0
    high_risk_actions = 0
    for item in insights:
        for issue in item.get("topIssues", []):
            if normalize_impact(issue.get("impact", "")) == "critical":
                critical_issues += 1
            if normalize_risk(issue.get("businessRisk", "")) == "high":
                high_risk_actions += len(issue.get("recommendedActions", []))

    latest = max(
        (i.get("generatedAt") for i in insights if i.get("generatedAt")),
        default=datetime.now(timezone.utc).isoformat(),
    )

    return {
        "projectName": "GameN Insight",
        "subtitle": "AI 기반 글로벌 게임 운영 인텔리전스 플랫폼",
        "totalGames": len(insights),
        "totalReviews": total_reviews,
        "negativeReviews": negative,
        "positiveReviews": positive,
        "topRiskGame": pick_top_risk_game(insights),
        "topRiskCategory": pick_top_risk_category(insights),
        "criticalIssues": critical_issues,
        "highRiskActions": high_risk_actions,
        "updatedAt": latest,
    }


def build_game_cards(insights: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    for item in insights:
        top = item["topIssues"][0] if item.get("topIssues") else {}
        drivers = [
            d.get("driver", "")
            for d in item.get("positiveDrivers", [])[:3]
            if d.get("driver")
        ]
        summary = (
            item.get("executiveSummary", [""])[1]
            if len(item.get("executiveSummary", [])) > 1
            else f"{item['game']} operational intelligence snapshot."
        )
        cards.append(
            {
                "game": item["game"],
                "reviewCount": item.get("totalReviewsAnalyzed", 0),
                "mainIssue": top.get("title", "N/A"),
                "mainIssueFrequency": top.get("frequency", 0),
                "riskLevel": impact_label(top.get("impact", "low")),
                "businessRisk": risk_label(top.get("businessRisk", "low")),
                "summary": summary,
                "positiveDrivers": drivers,
                "recommendedFocus": (
                    top.get("recommendedActions", [""])[0]
                    if top.get("recommendedActions")
                    else "Monitor emerging operational themes."
                ),
            }
        )
    return cards


def issue_sort_key(row: dict[str, Any]) -> tuple[int, int, int]:
    return (
        -IMPACT_RANK.get(normalize_impact(row["impact"]), 0),
        -RISK_RANK.get(normalize_risk(row["businessRisk"]), 0),
        -int(row["frequency"]),
    )


def build_issue_ranking(insights: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for item in insights:
        game = item["game"]
        for issue in item.get("topIssues", []):
            rows.append(
                {
                    "game": game,
                    "category": issue.get("category", ""),
                    "issue": issue.get("title", issue.get("issue", "")),
                    "frequency": issue.get("frequency", 0),
                    "impact": impact_label(issue.get("impact", "low")),
                    "businessRisk": risk_label(issue.get("businessRisk", "low")),
                    "recommendedActions": issue.get("recommendedActions", []),
                    "expectedImpact": issue.get("expectedImpact", ""),
                    "evidence": issue.get("evidence", ""),
                }
            )

    rows.sort(key=issue_sort_key)
    ranking: list[dict[str, Any]] = []
    for idx, row in enumerate(rows, start=1):
        ranking.append({"rank": idx, **row})
    return ranking


def build_action_queue(insights: list[dict[str, Any]]) -> list[dict[str, Any]]:
    queue: list[dict[str, Any]] = []
    action_no = 1

    issues_flat: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for item in insights:
        for issue in item.get("topIssues", []):
            issues_flat.append((item, issue))

    issues_flat.sort(
        key=lambda pair: issue_sort_key(
            {
                "impact": pair[1].get("impact", "low"),
                "businessRisk": pair[1].get("businessRisk", "low"),
                "frequency": pair[1].get("frequency", 0),
            }
        )
    )

    for game_item, issue in issues_flat:
        priority = impact_label(issue.get("impact", "low"))
        reason = issue.get("evidence") or issue.get("issue", "")
        for action_text in issue.get("recommendedActions", []):
            queue.append(
                {
                    "actionId": f"ACT-{action_no:03d}",
                    "game": game_item["game"],
                    "priority": priority,
                    "category": issue.get("category", ""),
                    "action": action_text,
                    "reason": reason[:300],
                    "expectedImpact": issue.get("expectedImpact", ""),
                    "status": "pending",
                }
            )
            action_no += 1

    return queue


def build_language_panels(insights: list[dict[str, Any]]) -> list[dict[str, Any]]:
    panels: list[dict[str, Any]] = []
    for item in insights:
        game = item["game"]
        for lang in item.get("languageAnalysis", []):
            region = lang.get("region", "")
            suggestions = lang.get("operatorActions", [])
            panels.append(
                {
                    "game": game,
                    "languageGroup": LANGUAGE_GROUP_LABELS.get(
                        region, region.replace("_", " ").title()
                    ),
                    "reviewCount": lang.get("reviewCount", 0),
                    "mainComplaints": lang.get("topComplaints", []),
                    "positiveSignals": lang.get("topStrengths", []),
                    "operatorSuggestion": (
                        suggestions[0].split("]", 1)[-1].strip()
                        if suggestions
                        else "Monitor regional feedback weekly."
                    ),
                }
            )
    return panels


def build_portfolio_story() -> dict[str, str]:
    return dict(PORTFOLIO_STORY)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("GameN Insight — Dashboard Data Builder")
    print(f"Input:  {INSIGHTS_DIR}")
    print(f"Output: {OUTPUT_DIR}")

    insights = load_all_insights()
    _portfolio = load_json(INSIGHTS_DIR / "portfolio_operator_summary.json")

    outputs = {
        "dashboard_overview.json": build_dashboard_overview(insights),
        "game_cards.json": build_game_cards(insights),
        "issue_ranking.json": build_issue_ranking(insights),
        "action_queue.json": build_action_queue(insights),
        "language_panels.json": build_language_panels(insights),
        "portfolio_story.json": build_portfolio_story(),
    }

    created_files: list[str] = []
    for filename, payload in outputs.items():
        path = OUTPUT_DIR / filename
        save_json(path, payload)
        created_files.append(str(path))

    game_cards = outputs["game_cards.json"]
    issue_ranking = outputs["issue_ranking.json"]
    action_queue = outputs["action_queue.json"]
    language_panels = outputs["language_panels.json"]

    print("\n[생성 완료]")
    print("생성된 파일 목록:")
    for f in created_files:
        print(f"  - {f}")

    print(f"\n게임별 카드 개수: {len(game_cards)}")
    print(f"이슈 랭킹 개수: {len(issue_ranking)}")
    print(f"액션 큐 개수: {len(action_queue)}")
    print(f"언어 패널 개수: {len(language_panels)}")

    overview = outputs["dashboard_overview.json"]
    print("\n[Overview KPI]")
    print(f"  totalReviews: {overview['totalReviews']}")
    print(f"  topRiskGame: {overview['topRiskGame']}")
    print(f"  topRiskCategory: {overview['topRiskCategory']}")
    print(f"  criticalIssues: {overview['criticalIssues']}")
    print(f"  highRiskActions: {overview['highRiskActions']}")


if __name__ == "__main__":
    main()
