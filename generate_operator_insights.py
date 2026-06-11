#!/usr/bin/env python3
"""
AI 운영 인사이트 엔진 — Steam 리뷰에서 운영자 액션을 도출한다.
긍정률/부정률·단순 감정분석은 출력하지 않는다.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent / "data"
INSIGHTS_DIR = Path(__file__).resolve().parent / "insights"

GAMES = [
    {
        "game": "Brawlhalla",
        "slug": "brawlhalla",
        "negative_file": "brawlhalla_negative_500.json",
        "positive_file": "brawlhalla_positive_200.json",
    },
    {
        "game": "Stumble Guys",
        "slug": "stumble_guys",
        "negative_file": "stumble_guys_negative_500.json",
        "positive_file": "stumble_guys_positive_200.json",
    },
    {
        "game": "Goose Goose Duck",
        "slug": "goose_goose_duck",
        "negative_file": "goose_goose_duck_negative_500.json",
        "positive_file": "goose_goose_duck_positive_200.json",
    },
]

CATEGORIES = [
    "balance",
    "matchmaking",
    "server",
    "performance",
    "monetization",
    "advertisement",
    "translation",
    "uiux",
    "content",
    "community",
    "tutorial",
    "toxicity",
    "other",
]

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "balance": [
        "balance", "balanced", "broken", "op", "overpowered", "nerf", "buff",
        "spam", "combo", "hitbox", "weapon", "sig", "unfair", "meta",
    ],
    "matchmaking": [
        "matchmaking", "match making", "ranked", "mmr", "elo", "unfair match",
        "smurf", "queue", "lobby",
    ],
    "server": [
        "server", "lag", "latency", "ping", "disconnect", "connection",
        "netcode", "unplayable", "freeze", "desync",
    ],
    "performance": [
        "fps", "frame", "stutter", "crash", "bug", "glitch", "optimization",
        "loading", "freeze", "memory",
    ],
    "monetization": [
        "skin", "skins", "coin", "coins", "chest", "lootbox", "pay", "paid",
        "expensive", "price", "gambling", "microtransaction", "battle pass",
        "premium", "dlc", "grind",
    ],
    "advertisement": [
        "ad", "ads", "advertisement", "advertising", "rewarded ad",
    ],
    "translation": [
        "translation", "localization", "localisation", "subtitle", "translate",
    ],
    "uiux": [
        " ui ", " ux ", "menu", "interface", "button", "control", "hud",
        "navigate", "clunky",
    ],
    "content": [
        "content", "update", "event", "map", "mode", "repetitive", "boring",
        "lack of", "stale", "variety",
    ],
    "community": [
        "community", "playerbase", "player base", "rematch", "emote", "report",
        "player count",
    ],
    "tutorial": [
        "tutorial", "beginner", "new player", "onboarding", "learning curve",
        "newbie", "guide",
    ],
    "toxicity": [
        "toxic", "toxicity", "grief", "griefing", "harass", "harassment",
        "racist", "hate speech", "cheater", "cheating", "hack", "hacker",
        "thumbs down", "bully",
    ],
}

INTENSITY_WORDS = [
    "unplayable", "uninstall", "worst", "broken", "never again", "refund",
    "scam", "garbage", "trash", "hate", "ruined", "impossible", "intolerable",
    "quit", "leaving", "dead game", "cash grab",
]

UNPLAYABLE_SIGNALS = [
    "unplayable", "disconnect", "crash", "cannot play", "can't play",
    "netcode", "lag", "freeze", "not loading",
]

CHURN_SIGNALS = [
    "new player", "beginner", "tutorial", "onboarding", "learning curve",
    "first time", "quit", "uninstall", "leaving",
]

MONETIZATION_SIGNALS = CATEGORY_KEYWORDS["monetization"]

POSITIVE_DRIVER_KEYWORDS: dict[str, list[str]] = {
    "friends_and_social_play": [
        "friend", "friends", "with friends", "party", "squad", "crew",
        "multiplayer", "co-op", "coop", "together",
    ],
    "free_access_and_value": [
        "free", "f2p", "no pay", "without paying", "accessible",
    ],
    "character_and_content_variety": [
        "character", "characters", "legend", "legends", "role", "roles",
        "variety", "maps", "modes", "content", "skins", "cosmetic",
    ],
    "events_and_updates": [
        "event", "events", "update", "season", "battle pass",
    ],
    "fun_and_casual_enjoyment": [
        "fun", "enjoy", "entertaining", "hilarious", "love", "addictive",
        "chaos", "laugh",
    ],
    "among_us_style_social_deduction": [
        "among us", "social deduction", "deduction", "impostor", "traitor",
    ],
}

LANGUAGE_REGIONS = {
    "english": {"english"},
    "brazil_portuguese": {"brazilian", "portuguese"},
    "spanish": {"spanish", "latam"},
}

CATEGORY_LABELS = {
    "balance": "Balance & Combat Fairness",
    "matchmaking": "Matchmaking & Ranked Integrity",
    "server": "Server Stability & Netcode",
    "performance": "Client Performance & Stability",
    "monetization": "Monetization & Pricing",
    "advertisement": "Advertising Experience",
    "translation": "Localization & Translation",
    "uiux": "UI/UX & Controls",
    "content": "Content Depth & Live Ops",
    "community": "Community & Player Experience",
    "tutorial": "Onboarding & Tutorial",
    "toxicity": "Toxicity & Fair Play",
    "other": "General Experience",
}

BUSINESS_RISK_BY_CATEGORY = {
    "server": "high",
    "performance": "high",
    "matchmaking": "high",
    "monetization": "high",
    "toxicity": "high",
    "advertisement": "medium",
    "balance": "medium",
    "community": "medium",
    "tutorial": "medium",
    "translation": "medium",
    "uiux": "medium",
    "content": "medium",
    "other": "low",
}

ACTION_TEMPLATES: dict[str, dict[str, Any]] = {
    "server": {
        "issue": "Server Instability & Network Quality",
        "actions": [
            "Monitor packet loss and disconnect rate by region and ISP.",
            "Separate ranked and casual network telemetry dashboards.",
            "Run incident postmortems on peak-hour lag spikes with rollback criteria.",
            "Publish a network status page when regional degradation exceeds SLA.",
        ],
        "impact": (
            "Reduced session frustration, improved ranked trust, and lower "
            "churn among competitive players."
        ),
    },
    "performance": {
        "issue": "Client Performance & Technical Reliability",
        "actions": [
            "Profile crash and freeze clusters by device tier and OS version.",
            "Prioritize frame-time stability fixes on low-end mobile and PC specs.",
            "Add automated regression tests for loading-time and memory spikes.",
            "Ship hotfix channel for game-breaking bugs within 48h SLA.",
        ],
        "impact": (
            "Higher session completion, fewer refund-driven negative reviews, "
            "and improved store rating recovery."
        ),
    },
    "matchmaking": {
        "issue": "Matchmaking Fairness & Skill Integrity",
        "actions": [
            "Audit MMR/Elo spread in ranked queues by region and time slot.",
            "Introduce smurf-detection heuristics and report feedback loops.",
            "Cap rank disparity in solo ranked while monitoring queue time.",
            "Communicate matchmaking policy changes in patch notes.",
        ],
        "impact": (
            "Restored competitive fairness perception and reduced ranked abandonment."
        ),
    },
    "balance": {
        "issue": "Combat Balance & Meta Health",
        "actions": [
            "Publish balance patch cadence with telemetry on pick/win rates.",
            "Target top-outlier legends/weapons with nerfs and counter-picks.",
            "Run PTR/beta feedback window before ranked-impacting changes.",
            "Document hitbox and combo tuning rationale for community trust.",
        ],
        "impact": (
            "More diverse meta, fewer 'broken character' narratives, "
            "and improved long-term ranked engagement."
        ),
    },
    "monetization": {
        "issue": "Monetization Pressure & Perceived Value",
        "actions": [
            "Review price ladders vs. regional purchasing power.",
            "Increase earnable currency pathways without paywalling core modes.",
            "Disclose drop rates and reduce lootbox-style friction where applicable.",
            "A/B test starter bundles for new-player conversion vs. backlash.",
        ],
        "impact": (
            "Lower pay-to-win perception, improved ARPPU/LTV balance, "
            "and fewer monetization-driven negative reviews."
        ),
    },
    "advertisement": {
        "issue": "Ad Frequency & Reward Fairness",
        "actions": [
            "Cap ad impressions per session and segment by player tenure.",
            "Offer ad-free progression path via battle pass or loyalty tier.",
            "Measure ad-related uninstall/negative review correlation weekly.",
        ],
        "impact": (
            "Reduced ad fatigue while preserving ad revenue on opted-in segments."
        ),
    },
    "translation": {
        "issue": "Localization Gaps",
        "actions": [
            "Audit top complaint languages for missing or incorrect strings.",
            "Prioritize UI, store, and tutorial text in BR/ES/EN markets.",
            "Establish community localization QA before major releases.",
        ],
        "impact": (
            "Improved comprehension in priority regions and fewer language-driven refunds."
        ),
    },
    "uiux": {
        "issue": "UI/UX Friction",
        "actions": [
            "Run usability tests on menu navigation and control remapping.",
            "Fix top-reported button/layout issues in first-time user flow.",
            "Add contextual tooltips for complex modes and ranked entry.",
        ],
        "impact": "Faster time-to-fun and lower early-session drop-off.",
    },
    "content": {
        "issue": "Content Freshness & Variety",
        "actions": [
            "Accelerate rotating events and mode variety in live ops calendar.",
            "Communicate roadmap for maps/modes/characters players request most.",
            "Bundle stale-period retention offers tied to returning-player quests.",
        ],
        "impact": (
            "Higher return rate between seasons and stronger positive word-of-mouth."
        ),
    },
    "community": {
        "issue": "Community Health & Social Features",
        "actions": [
            "Improve report/mute pipeline SLAs and feedback to reporters.",
            "Incentivize positive comms (commendations, party rewards).",
            "Staff community managers for region-specific Discord/forum response.",
        ],
        "impact": "Healthier multiplayer environment and improved friend-invite conversion.",
    },
    "tutorial": {
        "issue": "Onboarding & New Player Experience",
        "actions": [
            "Shorten tutorial with optional advanced training modules.",
            "Add guided first-match vs. bots before ranked exposure.",
            "Track D1/D7 retention split for players who skip tutorial.",
        ],
        "impact": (
            "Lower new-user churn and fewer 'confusing for beginners' reviews."
        ),
    },
    "toxicity": {
        "issue": "Toxicity & Cheating",
        "actions": [
            "Escalate auto-moderation for slurs and harassment with appeal flow.",
            "Deploy anti-cheat telemetry review for spike reports post-patch.",
            "Publish enforcement transparency report monthly.",
        ],
        "impact": (
            "Safer social play, higher friend retention, reduced brand risk."
        ),
    },
    "other": {
        "issue": "General Player Experience",
        "actions": [
            "Cluster uncategorized feedback into emerging themes weekly.",
            "Run PM triage on high-vote negative reviews for quick wins.",
        ],
        "impact": "Incremental satisfaction gains across mixed complaint types.",
    },
}


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", f" {text or ''} ".strip().lower())


def keyword_hits(text: str, keywords: list[str]) -> int:
    norm = normalize_text(text)
    total = 0
    for kw in keywords:
        if " " in kw:
            total += norm.count(kw)
        else:
            total += len(re.findall(rf"\b{re.escape(kw)}\b", norm))
    return total


def classify_categories(review: dict[str, Any]) -> list[str]:
    text = review.get("review", "")
    hits: list[tuple[str, int]] = []
    for cat, keywords in CATEGORY_KEYWORDS.items():
        count = keyword_hits(text, keywords)
        if count > 0:
            hits.append((cat, count))
    if not hits:
        return ["other"]
    hits.sort(key=lambda x: -x[1])
    return [cat for cat, _ in hits]


def sentiment_intensity(text: str, is_negative: bool) -> float:
    norm = normalize_text(text)
    score = sum(1.0 for w in INTENSITY_WORDS if w in norm)
    if is_negative:
        score += 0.5
    length = len(text.strip())
    if length > 200:
        score += 1.0
    if length > 500:
        score += 1.0
    return min(score, 5.0)


def review_signals(review: dict[str, Any]) -> dict[str, bool]:
    text = review.get("review", "")
    norm = normalize_text(text)
    playtime = review.get("playtime_at_review") or review.get("playtime_forever") or 0
    return {
        "unplayable": any(s in norm for s in UNPLAYABLE_SIGNALS),
        "monetization": any(s in norm for s in MONETIZATION_SIGNALS),
        "churn_risk": any(s in norm for s in CHURN_SIGNALS) or playtime < 120,
        "high_intensity": sentiment_intensity(text, not review.get("voted_up", True)) >= 2.5,
    }


def compute_impact(
    category: str,
    frequency: int,
    reviews: list[dict[str, Any]],
    category_review_ids: set[str],
) -> str:
    matched = [r for r in reviews if r["recommendationid"] in category_review_ids]
    if not matched:
        return "low"

    signals = [review_signals(r) for r in matched]
    unplayable_rate = sum(1 for s in signals if s["unplayable"]) / len(signals)
    monetization_rate = sum(1 for s in signals if s["monetization"]) / len(signals)
    churn_rate = sum(1 for s in signals if s["churn_risk"]) / len(signals)
    intensity_rate = sum(1 for s in signals if s["high_intensity"]) / len(signals)

    score = 0.0
    score += min(frequency / 20, 4.0)
    score += intensity_rate * 3
    score += unplayable_rate * 4
    score += monetization_rate * 2 if category == "monetization" else monetization_rate
    score += churn_rate * 2 if category in ("tutorial", "matchmaking", "server") else churn_rate

    if category in ("server", "performance", "matchmaking") and unplayable_rate > 0.15:
        score += 2
    if category == "monetization" and monetization_rate > 0.2:
        score += 2

    if score >= 7 or (frequency >= 40 and intensity_rate > 0.3):
        return "critical"
    if score >= 5 or frequency >= 25:
        return "high"
    if score >= 3 or frequency >= 10:
        return "medium"
    return "low"


def impact_rank(impact: str) -> int:
    return {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(impact, 0)


def extract_evidence(reviews: list[dict[str, Any]], category: str, limit: int = 5) -> list[str]:
    snippets: list[str] = []
    keywords = CATEGORY_KEYWORDS.get(category, [])
    for review in reviews:
        text = (review.get("review") or "").strip()
        if not text or len(text) < 15:
            continue
        norm = normalize_text(text)
        if category != "other" and not any(
            (kw in norm if " " in kw else re.search(rf"\b{re.escape(kw)}\b", norm))
            for kw in keywords
        ):
            continue
        snippet = text.replace("\n", " ")[:220]
        if snippet not in snippets:
            snippets.append(snippet)
        if len(snippets) >= limit:
            break
    return snippets


def build_operator_action(
    category: str,
    frequency: int,
    impact: str,
    evidence_snippets: list[str],
) -> dict[str, Any]:
    template = ACTION_TEMPLATES.get(category, ACTION_TEMPLATES["other"])
    evidence_parts = []
    if evidence_snippets:
        evidence_parts.append(
            f"{frequency} reviews reference {category}-related issues."
        )
        evidence_parts.append(
            "Sample signals: " + " | ".join(evidence_snippets[:3])
        )
    else:
        evidence_parts.append(
            f"{frequency} reviews clustered under {category} with operational keywords."
        )

    return {
        "issue": template["issue"],
        "evidence": " ".join(evidence_parts),
        "recommendedActions": template["actions"],
        "expectedImpact": template["impact"],
        "impact": impact,
        "businessRisk": BUSINESS_RISK_BY_CATEGORY.get(category, "medium"),
    }


def map_language_region(lang: str) -> str | None:
    lang = (lang or "").strip().lower()
    for region, codes in LANGUAGE_REGIONS.items():
        if lang in codes:
            return region
    return None


def analyze_language_region(
    reviews: list[dict[str, Any]],
    region: str,
) -> dict[str, Any]:
    region_reviews = [
        r for r in reviews if map_language_region(r.get("language", "")) == region
    ]
    if not region_reviews:
        return {
            "region": region,
            "reviewCount": 0,
            "topComplaints": [],
            "topStrengths": [],
            "operatorActions": [],
        }

    neg = [r for r in region_reviews if not r.get("voted_up")]
    pos = [r for r in region_reviews if r.get("voted_up")]

    complaint_counter: Counter[str] = Counter()
    for r in neg:
        for cat in classify_categories(r):
            if cat != "other":
                complaint_counter[cat] += 1

    strength_counter: Counter[str] = Counter()
    for r in pos:
        text = normalize_text(r.get("review", ""))
        for driver, keywords in POSITIVE_DRIVER_KEYWORDS.items():
            if keyword_hits(text, keywords) > 0:
                strength_counter[driver] += 1

    top_complaints = [
        CATEGORY_LABELS.get(c, c)
        for c, _ in complaint_counter.most_common(4)
    ]
    top_strengths = [
        driver.replace("_", " ").title()
        for driver, _ in strength_counter.most_common(4)
    ]

    actions = []
    for cat, _ in complaint_counter.most_common(2):
        tmpl = ACTION_TEMPLATES.get(cat, ACTION_TEMPLATES["other"])
        actions.append(
            f"[{region}] {tmpl['actions'][0]}"
        )

    if not actions and region_reviews:
        actions.append(
            f"[{region}] Monitor emerging themes weekly; volume={len(region_reviews)} reviews."
        )

    return {
        "region": region,
        "reviewCount": len(region_reviews),
        "topComplaints": top_complaints or ["No dominant categorized complaint"],
        "topStrengths": top_strengths or ["Social fun", "Accessibility"],
        "operatorActions": actions[:3],
    }


def detect_positive_drivers(positive_reviews: list[dict[str, Any]]) -> list[dict[str, Any]]:
    counter: Counter[str] = Counter()
    examples: dict[str, list[str]] = defaultdict(list)

    for review in positive_reviews:
        text = normalize_text(review.get("review", ""))
        for driver, keywords in POSITIVE_DRIVER_KEYWORDS.items():
            if keyword_hits(text, keywords) > 0:
                counter[driver] += 1
                snippet = (review.get("review") or "").strip().replace("\n", " ")[:160]
                if snippet and len(examples[driver]) < 2:
                    examples[driver].append(snippet)

    labels = {
        "friends_and_social_play": "Play With Friends & Social Sessions",
        "free_access_and_value": "Free Access & Perceived Value",
        "character_and_content_variety": "Character/Mode Variety",
        "events_and_updates": "Events & Live Updates",
        "fun_and_casual_enjoyment": "Casual Fun & Entertainment",
        "among_us_style_social_deduction": "Social Deduction Gameplay",
    }

    drivers = []
    for key, count in counter.most_common():
        drivers.append({
            "driver": labels.get(key, key),
            "mentionCount": count,
            "preserveActions": _preserve_actions(key),
            "examples": examples.get(key, [])[:2],
        })
    return drivers[:8]


def _preserve_actions(driver_key: str) -> list[str]:
    mapping = {
        "friends_and_social_play": [
            "Maintain party/squad stability and friend-invite rewards.",
            "Promote co-play events in weekends and holidays.",
        ],
        "free_access_and_value": [
            "Protect core modes from paywall expansion.",
            "Highlight free progression paths in store and onboarding.",
        ],
        "character_and_content_variety": [
            "Keep rotating content cadence visible on roadmap.",
            "Balance new releases between casual and ranked players.",
        ],
        "events_and_updates": [
            "Sustain seasonal events with clear earn rules.",
            "Pre-announce update beats to reduce 'stale game' sentiment.",
        ],
        "fun_and_casual_enjoyment": [
            "Avoid over-tuning casual modes for hardcore-only meta.",
            "Celebrate community clips and meme-friendly modes.",
        ],
        "among_us_style_social_deduction": [
            "Invest in role/map variety without bloating tutorial burden.",
            "Strengthen moderation for public lobbies.",
        ],
    }
    return mapping.get(driver_key, ["Continue monitoring positive themes in patch notes."])


def generate_executive_summary(
    game: str,
    top_issues: list[dict[str, Any]],
    positive_drivers: list[dict[str, Any]],
    total_reviews: int,
) -> list[str]:
    lines: list[str] = []
    lines.append(
        f"{game}: {total_reviews} Steam reviews analyzed for live-ops decision support "
        f"(operations intelligence, not sentiment ratio reporting)."
    )
    if top_issues:
        top = top_issues[0]
        lines.append(
            f"Priority #{top['priority']}: {top['title']} — {top['frequency']} mentions, "
            f"{top['impact']} impact, {top['businessRisk']} business risk."
        )
        if len(top_issues) > 1:
            second = top_issues[1]
            lines.append(
                f"Secondary focus: {second['title']} ({second['frequency']} mentions, "
                f"{second['impact']} impact)."
            )
    if positive_drivers:
        keep = ", ".join(d["driver"] for d in positive_drivers[:3])
        lines.append(f"Preserve strengths players explicitly praise: {keep}.")
    lines.append(
        "Recommended operating posture: ship network/matchmaking telemetry first, "
        "then monetization clarity, then content cadence communication."
    )
    lines.append(
        "Risk if unaddressed: elevated churn in ranked segments and rising "
        "store-review backlash in priority language regions."
    )
    lines.append(
        "Next 30-day KPI focus: disconnect rate, ranked queue fairness, "
        "new-player D7 retention, and monetization-related negative review velocity."
    )
    return lines[:10]


def load_game_reviews(cfg: dict[str, str]) -> list[dict[str, Any]]:
    reviews: list[dict[str, Any]] = []
    for key in ("negative_file", "positive_file"):
        path = DATA_DIR / cfg[key]
        with path.open(encoding="utf-8") as f:
            data = json.load(f)
        for r in data.get("reviews", []):
            reviews.append(
                {
                    **r,
                    "recommendationid": str(r.get("recommendationid", "")),
                    "sourceReviewType": "negative" if "negative" in key else "positive",
                }
            )
    return reviews


def analyze_game(cfg: dict[str, str]) -> dict[str, Any]:
    game = cfg["game"]
    reviews = load_game_reviews(cfg)
    negative_reviews = [r for r in reviews if not r.get("voted_up")]
    positive_reviews = [r for r in reviews if r.get("voted_up")]

    category_frequency: Counter[str] = Counter()
    category_to_ids: dict[str, set[str]] = defaultdict(set)

    for review in reviews:
        cats = classify_categories(review)
        for cat in cats:
            category_frequency[cat] += 1
            category_to_ids[cat].add(review["recommendationid"])

    issue_candidates = []
    for cat in CATEGORIES:
        if cat == "other":
            continue
        freq = category_frequency.get(cat, 0)
        if freq == 0:
            continue
        impact = compute_impact(cat, freq, reviews, category_to_ids[cat])
        issue_candidates.append(
            {
                "category": cat,
                "frequency": freq,
                "impact": impact,
                "impactRank": impact_rank(impact),
            }
        )

    for item in issue_candidates:
        item["priorityScore"] = item["frequency"] * (item["impactRank"] + 1)

    issue_candidates.sort(
        key=lambda x: (-x["priorityScore"], -x["frequency"], x["category"])
    )

    top_issues = []
    for idx, item in enumerate(issue_candidates[:8], start=1):
        cat = item["category"]
        evidence = extract_evidence(
            [r for r in reviews if r["recommendationid"] in category_to_ids[cat]],
            cat,
        )
        action_block = build_operator_action(
            cat, item["frequency"], item["impact"], evidence
        )
        top_issues.append(
            {
                "priority": idx,
                "category": cat,
                "title": CATEGORY_LABELS.get(cat, cat),
                "frequency": item["frequency"],
                "impact": item["impact"],
                "businessRisk": action_block["businessRisk"],
                "issue": action_block["issue"],
                "evidence": action_block["evidence"],
                "recommendedActions": action_block["recommendedActions"],
                "expectedImpact": action_block["expectedImpact"],
            }
        )

    positive_drivers = detect_positive_drivers(positive_reviews)

    language_analysis = [
        analyze_language_region(reviews, "english"),
        analyze_language_region(reviews, "brazil_portuguese"),
        analyze_language_region(reviews, "spanish"),
    ]

    operator_actions = []
    for issue in top_issues[:5]:
        operator_actions.append(
            {
                "priority": issue["priority"],
                "category": issue["category"],
                "actionSummary": issue["recommendedActions"][0],
                "expectedImpact": issue["expectedImpact"],
            }
        )

    return {
        "game": game,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalReviewsAnalyzed": len(reviews),
        "negativeReviewCount": len(negative_reviews),
        "positiveReviewCount": len(positive_reviews),
        "categoryFrequency": dict(
            sorted(category_frequency.items(), key=lambda x: -x[1])
        ),
        "executiveSummary": generate_executive_summary(
            game, top_issues, positive_drivers, len(reviews)
        ),
        "topIssues": top_issues,
        "positiveDrivers": positive_drivers,
        "languageAnalysis": language_analysis,
        "topOperatorActions": operator_actions,
    }


def print_console_report(insight: dict[str, Any]) -> None:
    game = insight["game"]
    print(f"\n{'=' * 72}")
    print(f"  {game} — Operator Intelligence Report")
    print(f"{'=' * 72}")

    print("\n[Executive Summary]")
    for line in insight["executiveSummary"]:
        print(f"  • {line}")

    print("\n[Category Frequency]")
    for cat, cnt in insight["categoryFrequency"].items():
        if cat != "other":
            print(f"  {cat}: {cnt}")

    print("\n[Top Issues]")
    for issue in insight["topIssues"][:5]:
        print(
            f"  Priority #{issue['priority']} | {issue['title']} | "
            f"Freq={issue['frequency']} | Impact={issue['impact'].upper()} | "
            f"Risk={issue['businessRisk'].upper()}"
        )
        print(f"    Issue: {issue['issue']}")
        print(f"    Action: {issue['recommendedActions'][0]}")

    print("\n[Top Positive Drivers — Preserve]")
    for driver in insight["positiveDrivers"][:5]:
        print(
            f"  • {driver['driver']} ({driver['mentionCount']} mentions) — "
            f"{driver['preserveActions'][0]}"
        )

    print("\n[Top Operator Actions]")
    for action in insight["topOperatorActions"]:
        print(
            f"  #{action['priority']} [{action['category']}] "
            f"{action['actionSummary']}"
        )

    print("\n[Language Regions]")
    for lang in insight["languageAnalysis"]:
        print(
            f"  {lang['region']}: {lang['reviewCount']} reviews | "
            f"Complaints: {', '.join(lang['topComplaints'][:3])} | "
            f"Strengths: {', '.join(lang['topStrengths'][:3])}"
        )


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("AI Operator Insights Engine — GameN Global Live Ops")
    print(f"Input:  {DATA_DIR}")
    print(f"Output: {INSIGHTS_DIR}")

    INSIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    all_insights: list[dict[str, Any]] = []

    for cfg in GAMES:
        insight = analyze_game(cfg)
        out_path = INSIGHTS_DIR / f"{cfg['slug']}_insights.json"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(insight, f, ensure_ascii=False, indent=2)
        print(f"\nSaved: {out_path}")
        print_console_report(insight)
        all_insights.append(insight)

    portfolio_path = INSIGHTS_DIR / "portfolio_operator_summary.json"
    with portfolio_path.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "games": [
                    {
                        "game": i["game"],
                        "topIssue": i["topIssues"][0] if i["topIssues"] else None,
                        "topPositiveDriver": i["positiveDrivers"][0]
                        if i["positiveDrivers"]
                        else None,
                    }
                    for i in all_insights
                ],
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
    print(f"\nPortfolio summary: {portfolio_path}")
    print("\nDone — operator insights generated (no sentiment ratio output).")


if __name__ == "__main__":
    main()
