#!/usr/bin/env python3
"""Steam 리뷰 JSON 데이터 품질 및 운영 인사이트 가능성 검증."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent / "data"

FILES = [
    {
        "path": "brawlhalla_negative_500.json",
        "label": "Brawlhalla Negative",
        "game": "Brawlhalla",
    },
    {
        "path": "brawlhalla_positive_200.json",
        "label": "Brawlhalla Positive",
        "game": "Brawlhalla",
    },
    {
        "path": "stumble_guys_negative_500.json",
        "label": "Stumble Guys Negative",
        "game": "Stumble Guys",
    },
    {
        "path": "stumble_guys_positive_200.json",
        "label": "Stumble Guys Positive",
        "game": "Stumble Guys",
    },
    {
        "path": "goose_goose_duck_negative_500.json",
        "label": "Goose Goose Duck Negative",
        "game": "Goose Goose Duck",
    },
    {
        "path": "goose_goose_duck_positive_200.json",
        "label": "Goose Goose Duck Positive",
        "game": "Goose Goose Duck",
    },
]

REQUIRED_FIELDS = [
    "recommendationid",
    "language",
    "review",
    "voted_up",
    "timestamp_created",
    "timestamp_updated",
    "playtime_forever",
    "playtime_at_review",
    "votes_up",
    "votes_funny",
    "weighted_vote_score",
    "steam_purchase",
    "received_for_free",
]

LENGTH_BUCKETS = [
    ("0~10자", 0, 10),
    ("11~20자", 11, 20),
    ("21~50자", 21, 50),
    ("51~100자", 51, 100),
    ("101~300자", 101, 300),
    ("301자 이상", 301, None),
]

LOW_INFO_PHRASES = {
    "good",
    "good game",
    "bad",
    "yes",
    "no",
    "nice",
    "ok",
    "awesome",
    "great",
    "lol",
    "boring",
    "trash",
    "ass",
}

SWEAR_ONLY_WORDS = {
    "shit",
    "fuck",
    "fucking",
    "damn",
    "ass",
    "bitch",
    "crap",
    "suck",
    "sucks",
    "garbage",
    "trash",
    "asshole",
    "bullshit",
    "wtf",
    "stupid",
    "idiot",
}

LOW_VALUE_PHRASES = LOW_INFO_PHRASES | {
    "fun",
    "not fun",
    "mid",
    "meh",
    "10/10",
    "5/10",
    "w game",
    "l game",
    "peak",
    "goated",
    "mid game",
    "peak game",
}

MEME_PATTERNS = [
    r"\bw game\b",
    r"\bl game\b",
    r"\bgoated\b",
    r"\bpeak\b",
    r"\b10/10\b",
    r"\b5/10\b",
    r"\bmid\b",
    r"\blol+\b",
    r"\blmao+\b",
    r"\brofl\b",
]

OPERATIONAL_CATEGORIES: dict[str, list[str]] = {
    "balance": [
        "balance", "balanced", "broken", "op", "overpowered", "nerf", "buff",
        "spam", "combo", "hitbox", "character", "weapon", "sig",
    ],
    "matchmaking": [
        "matchmaking", "match making", "ranked", "rank", "mmr", "elo",
        "unfair match", "smurf",
    ],
    "server": [
        "server", "lag", "latency", "ping", "disconnect", "connection",
        "netcode", "unplayable", "freeze",
    ],
    "performance": [
        "fps", "frame", "stutter", "crash", "bug", "glitch", "optimization",
        "loading",
    ],
    "monetization": [
        "skin", "skins", "coin", "coins", "chest", "lootbox", "pay", "paid",
        "expensive", "price", "gambling",
    ],
    "advertisement": ["ad", "ads", "advertisement"],
    "translation": ["translation", "localization", "language", "subtitle"],
    "uiux": ["ui", "ux", "menu", "interface", "button", "control"],
    "content": [
        "content", "update", "event", "map", "mode", "character", "boring",
        "repetitive",
    ],
    "community": [
        "community", "playerbase", "toxic", "toxicity", "thumbs down", "emote",
        "rematch", "report",
    ],
    "tutorial": [
        "tutorial", "beginner", "new player", "onboarding", "learning curve",
    ],
}

HIGH_VALUE_KEYWORDS = sorted(
    {kw for words in OPERATIONAL_CATEGORIES.values() for kw in words},
    key=len,
    reverse=True,
)

CRITICAL_SIGNAL_WORDS = [
    "reproduce", "reproducible", "steps", "every time", "always happens",
    "since update", "after patch", "should fix", "needs to fix", "devs should",
    "improve", "suggestion", "recommend", "root cause", "workaround",
    "multiple", "several issues", "not only", "also",
]


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def review_length(text: str) -> int:
    return len((text or "").strip())


def length_bucket(length: int) -> str:
    for label, low, high in LENGTH_BUCKETS:
        if high is None and length >= low:
            return label
        if high is not None and low <= length <= high:
            return label
    return LENGTH_BUCKETS[-1][0]


def is_random_string(text: str) -> bool:
    cleaned = re.sub(r"[^a-zA-Z0-9]", "", text)
    if len(cleaned) < 4:
        return False
    if re.fullmatch(r"(.)\1{3,}", cleaned, re.IGNORECASE):
        return True
    vowels = sum(1 for c in cleaned.lower() if c in "aeiou")
    if len(cleaned) >= 8 and vowels / len(cleaned) < 0.15:
        return True
    if re.fullmatch(r"[a-z]{4,12}", cleaned, re.IGNORECASE) and vowels == 0:
        return True
    return False


def is_swear_only(text: str) -> bool:
    tokens = re.findall(r"[a-zA-Z']+", normalize_text(text))
    if not tokens:
        return False
    return all(token in SWEAR_ONLY_WORDS for token in tokens)


def is_low_information(review: dict[str, Any]) -> bool:
    text = (review.get("review") or "").strip()
    norm = normalize_text(text)
    length = review_length(text)

    if length <= 10:
        return True
    if norm in LOW_INFO_PHRASES:
        return True
    if is_swear_only(text):
        return True
    if is_random_string(text):
        return True
    if length <= 20 and norm in LOW_VALUE_PHRASES:
        return True
    return False


def count_keyword_hits(text: str) -> dict[str, int]:
    norm = normalize_text(text)
    hits: dict[str, int] = {}
    for category, keywords in OPERATIONAL_CATEGORIES.items():
        count = 0
        for kw in keywords:
            if " " in kw:
                count += norm.count(kw)
            else:
                count += len(re.findall(rf"\b{re.escape(kw)}\b", norm))
        if count:
            hits[category] = count
    return hits


def matched_categories(text: str) -> list[str]:
    return [cat for cat, cnt in count_keyword_hits(text).items() if cnt > 0]


def classify_operational_value(review: dict[str, Any]) -> str:
    text = (review.get("review") or "").strip()
    norm = normalize_text(text)
    length = review_length(text)
    categories = matched_categories(text)
    category_count = len(categories)

    critical_score = 0
    if length >= 301:
        critical_score += 2
    if length >= 150 and category_count >= 2:
        critical_score += 2
    if any(sig in norm for sig in CRITICAL_SIGNAL_WORDS):
        critical_score += 1
    if category_count >= 3:
        critical_score += 1
    if re.search(r"\b(fix|patch|update|version)\b", norm) and category_count >= 1:
        critical_score += 1

    if critical_score >= 3:
        return "Critical Value"

    if category_count >= 1 or any(kw in norm for kw in HIGH_VALUE_KEYWORDS):
        if length >= 51 or category_count >= 2:
            return "High Value"

    if is_low_information(review):
        return "Low Value"

    if length <= 20 or is_swear_only(text):
        return "Low Value"

    if any(re.search(p, norm) for p in MEME_PATTERNS):
        return "Low Value"

    if length <= 50 and not categories:
        if re.search(r"\b(good|great|bad|love|hate|fun|boring|trash|garbage)\b", norm):
            return "Low Value"

    if length <= 80 and not categories:
        return "Medium Value"

    if categories and length < 51:
        return "Medium Value"

    if length >= 101 and category_count == 0:
        return "Medium Value"

    return "Medium Value"


def load_file(meta: dict[str, str]) -> dict[str, Any]:
    path = DATA_DIR / meta["path"]
    result: dict[str, Any] = {
        "meta": meta,
        "path": path,
        "exists": path.exists(),
        "loaded": False,
        "data": None,
        "error": None,
    }
    if not path.exists():
        result["error"] = "file not found"
        return result
    try:
        with path.open(encoding="utf-8") as f:
            result["data"] = json.load(f)
        result["loaded"] = True
    except Exception as exc:
        result["error"] = str(exc)
    return result


def analyze_file(
    file_result: dict[str, Any],
    global_id_map: dict[str, list[str]],
) -> dict[str, Any]:
    meta = file_result["meta"]
    analysis: dict[str, Any] = {
        "file": meta["path"],
        "label": meta["label"],
        "game": meta["game"],
        "exists": file_result["exists"],
        "loaded": file_result["loaded"],
        "error": file_result.get("error"),
    }

    if not file_result["loaded"] or not file_result["data"]:
        analysis["verdict"] = "NO GO"
        analysis["scores"] = {
            "data_quality_score": 0,
            "operational_insight_score": 0,
            "language_diversity_score": 0,
            "ai_readiness_score": 0,
            "portfolio_readiness_score": 0,
        }
        return analysis

    data = file_result["data"]
    reviews = data.get("reviews") or []
    target = data.get("targetCount", 0)
    actual = data.get("actualCount", len(reviews))
    reviews_len = len(reviews)

    analysis["count_check"] = {
        "targetCount": target,
        "actualCount": actual,
        "reviews_length": reviews_len,
        "status": "OK" if target == actual == reviews_len else "MISMATCH",
    }

    missing_field_issues: list[dict[str, str]] = []
    for review in reviews:
        rec_id = str(review.get("recommendationid", "unknown"))
        missing = [f for f in REQUIRED_FIELDS if f not in review]
        if missing:
            missing_field_issues.append(
                {
                    "recommendationid": rec_id,
                    "missing_fields": missing,
                }
            )
    analysis["missing_fields"] = {
        "issue_count": len(missing_field_issues),
        "issues": missing_field_issues[:50],
    }

    ids = [str(r.get("recommendationid", "")) for r in reviews]
    id_counter = Counter(ids)
    internal_dupes = sum(cnt - 1 for cnt in id_counter.values() if cnt > 1)
    analysis["duplicates"] = {
        "internal_duplicate_count": internal_dupes,
        "unique_ids": len(id_counter),
    }

    for rec_id in ids:
        if rec_id:
            global_id_map[rec_id].append(meta["path"])

    lang_counter = Counter(
        (r.get("language") or "unknown").strip() or "unknown" for r in reviews
    )
    analysis["language_distribution"] = dict(lang_counter.most_common(15))

    length_dist = Counter(length_bucket(review_length(r.get("review", ""))) for r in reviews)
    analysis["length_distribution"] = {
        label: length_dist.get(label, 0) for label, _, _ in LENGTH_BUCKETS
    }

    low_info_reviews = [r for r in reviews if is_low_information(r)]
    low_info_count = len(low_info_reviews)
    total = len(reviews) or 1
    analysis["low_information"] = {
        "count": low_info_count,
        "ratio": round(low_info_count / total, 4),
        "ratio_percent": round(low_info_count / total * 100, 2),
    }

    value_counter = Counter(classify_operational_value(r) for r in reviews)
    value_total = len(reviews) or 1
    analysis["operational_value"] = {
        level: {
            "count": value_counter.get(level, 0),
            "ratio_percent": round(value_counter.get(level, 0) / value_total * 100, 2),
        }
        for level in [
            "Low Value",
            "Medium Value",
            "High Value",
            "Critical Value",
        ]
    }

    category_counter: Counter[str] = Counter()
    for review in reviews:
        for cat in matched_categories(review.get("review", "")):
            category_counter[cat] += 1
    analysis["category_keywords"] = dict(
        sorted(category_counter.items(), key=lambda x: (-x[1], x[0]))
    )

    sorted_by_len = sorted(
        reviews,
        key=lambda r: review_length(r.get("review", "")),
        reverse=True,
    )
    analysis["samples"] = {
        "longest_3": [
            {
                "recommendationid": r.get("recommendationid"),
                "length": review_length(r.get("review", "")),
                "review": r.get("review", ""),
            }
            for r in sorted_by_len[:3]
        ],
        "high_critical_10": [
            {
                "recommendationid": r.get("recommendationid"),
                "value": classify_operational_value(r),
                "review": r.get("review", ""),
            }
            for r in reviews
            if classify_operational_value(r) in ("High Value", "Critical Value")
        ][:10],
        "low_information_10": [
            {
                "recommendationid": r.get("recommendationid"),
                "review": r.get("review", ""),
            }
            for r in low_info_reviews[:10]
        ],
    }

    high_critical_ratio = (
        value_counter.get("High Value", 0) + value_counter.get("Critical Value", 0)
    ) / total
    unique_langs = len(lang_counter)
    top_lang_share = lang_counter.most_common(1)[0][1] / total if lang_counter else 1

    count_ok = analysis["count_check"]["status"] == "OK"
    field_ok = len(missing_field_issues) == 0
    dupe_ok = internal_dupes == 0

    data_quality = 0.0
    if file_result["exists"]:
        data_quality += 20
    if file_result["loaded"]:
        data_quality += 20
    if count_ok:
        data_quality += 30
    if field_ok:
        data_quality += 20
    if dupe_ok:
        data_quality += 10

    operational_insight = min(100.0, high_critical_ratio * 100 * 1.2)

    lang_diversity = min(100.0, unique_langs * 6 + (1 - top_lang_share) * 40)

    ai_readiness = (
        operational_insight * 0.45
        + (1 - low_info_count / total) * 100 * 0.35
        + lang_diversity * 0.20
    )

    portfolio = (
        data_quality * 0.30
        + operational_insight * 0.25
        + lang_diversity * 0.15
        + ai_readiness * 0.30
    )

    scores = {
        "data_quality_score": round(data_quality, 1),
        "operational_insight_score": round(operational_insight, 1),
        "language_diversity_score": round(lang_diversity, 1),
        "ai_readiness_score": round(ai_readiness, 1),
        "portfolio_readiness_score": round(portfolio, 1),
    }
    analysis["scores"] = scores

    if (
        count_ok
        and field_ok
        and dupe_ok
        and scores["portfolio_readiness_score"] >= 70
        and low_info_count / total <= 0.15
        and high_critical_ratio >= 0.25
    ):
        verdict = "GO"
    elif (
        file_result["loaded"]
        and count_ok
        and scores["portfolio_readiness_score"] >= 50
        and low_info_count / total <= 0.35
    ):
        verdict = "PARTIAL GO"
    else:
        verdict = "NO GO"

    analysis["verdict"] = verdict
    return analysis


def print_section(title: str) -> None:
    print(f"\n{'=' * 70}")
    print(title)
    print(f"{'=' * 70}")


def print_file_report(analysis: dict[str, Any]) -> None:
    label = analysis["label"]
    print(f"\n--- {label} ---")

    if not analysis.get("exists"):
        print("Status: FAIL (file not found)")
        return

    if not analysis.get("loaded"):
        print(f"Status: FAIL ({analysis.get('error')})")
        return

    cc = analysis["count_check"]
    print(f"Target: {cc['targetCount']}")
    print(f"Actual: {cc['actualCount']}")
    print(f"Reviews Length: {cc['reviews_length']}")
    print(f"Status: {cc['status']}")

    if analysis["missing_fields"]["issue_count"]:
        print("\n[필수 필드 누락]")
        for issue in analysis["missing_fields"]["issues"][:20]:
            print(
                f"  file={analysis['file']} | id={issue['recommendationid']} | "
                f"missing={', '.join(issue['missing_fields'])}"
            )
    else:
        print("\n[필수 필드] OK - 모든 리뷰에 필수 필드 존재")

    dup = analysis["duplicates"]
    print(
        f"\n[중복] 파일 내부 중복: {dup['internal_duplicate_count']}개 "
        f"(고유 ID: {dup['unique_ids']})"
    )

    print("\n[언어 분포 - 상위 15]")
    for lang, cnt in analysis["language_distribution"].items():
        print(f"  {lang}: {cnt}")

    print("\n[리뷰 길이 분포]")
    for bucket, cnt in analysis["length_distribution"].items():
        print(f"  {bucket}: {cnt}")

    li = analysis["low_information"]
    print(
        f"\n[Low Information] {li['count']}개 "
        f"({li['ratio_percent']}%)"
    )

    print("\n[운영 가치 등급]")
    for level, info in analysis["operational_value"].items():
        print(f"  {level}: {info['count']}개 ({info['ratio_percent']}%)")

    print("\n[운영 카테고리 키워드]")
    if analysis["category_keywords"]:
        for cat, cnt in analysis["category_keywords"].items():
            print(f"  {cat}: {cnt}")
    else:
        print("  (매칭 없음)")

    print("\n[대표 샘플 - 가장 긴 리뷰 3개]")
    for item in analysis["samples"]["longest_3"]:
        preview = item["review"][:200].replace("\n", " ")
        print(
            f"  id={item['recommendationid']} | len={item['length']} | "
            f"{preview}{'...' if len(item['review']) > 200 else ''}"
        )

    print("\n[대표 샘플 - High/Critical 10개]")
    samples = analysis["samples"]["high_critical_10"]
    if not samples:
        print("  (해당 없음)")
    for item in samples:
        preview = item["review"][:180].replace("\n", " ")
        print(
            f"  [{item['value']}] id={item['recommendationid']} | {preview}"
        )

    print("\n[대표 샘플 - Low Information 10개]")
    for item in analysis["samples"]["low_information_10"]:
        print(f"  id={item['recommendationid']} | {item['review']!r}")

    sc = analysis["scores"]
    print("\n[점수]")
    print(f"  Data Quality Score: {sc['data_quality_score']}")
    print(f"  Operational Insight Score: {sc['operational_insight_score']}")
    print(f"  Language Diversity Score: {sc['language_diversity_score']}")
    print(f"  AI Readiness Score: {sc['ai_readiness_score']}")
    print(f"  Portfolio Readiness Score: {sc['portfolio_readiness_score']}")
    print(f"\n[최종 판정] {analysis['verdict']}")


def build_markdown_report(report: dict[str, Any]) -> str:
    lines = [
        "# Steam Review Data Quality Report",
        "",
        f"Generated: {report['generated_at']}",
        "",
        "## Summary",
        "",
        f"- Files checked: {report['summary']['files_checked']}",
        f"- Files loaded: {report['summary']['files_loaded']}",
        f"- Cross-file duplicate IDs: {report['summary']['cross_file_duplicate_count']}",
        "",
        "## Per-File Results",
        "",
    ]

    for fa in report["file_analyses"]:
        lines.append(f"### {fa['label']}")
        lines.append("")
        if not fa.get("loaded"):
            lines.append(f"- **Status:** File missing or failed to load ({fa.get('error')})")
            lines.append(f"- **Verdict:** {fa.get('verdict', 'NO GO')}")
            lines.append("")
            continue

        cc = fa["count_check"]
        lines.append(f"- **Count:** Target {cc['targetCount']} / Actual {cc['actualCount']} / Length {cc['reviews_length']} — {cc['status']}")
        lines.append(f"- **Verdict:** {fa['verdict']}")
        sc = fa["scores"]
        lines.append(f"- **Data Quality Score:** {sc['data_quality_score']}")
        lines.append(f"- **Operational Insight Score:** {sc['operational_insight_score']}")
        lines.append(f"- **Language Diversity Score:** {sc['language_diversity_score']}")
        lines.append(f"- **AI Readiness Score:** {sc['ai_readiness_score']}")
        lines.append(f"- **Portfolio Readiness Score:** {sc['portfolio_readiness_score']}")
        lines.append(f"- **Low Information:** {fa['low_information']['count']} ({fa['low_information']['ratio_percent']}%)")
        lines.append("")
        lines.append("**Language distribution (top 15):**")
        lines.append("")
        for lang, cnt in fa["language_distribution"].items():
            lines.append(f"- {lang}: {cnt}")
        lines.append("")
        lines.append("**Operational value:**")
        lines.append("")
        for level, info in fa["operational_value"].items():
            lines.append(f"- {level}: {info['count']} ({info['ratio_percent']}%)")
        lines.append("")
        lines.append("**Category keywords:**")
        lines.append("")
        if fa["category_keywords"]:
            for cat, cnt in fa["category_keywords"].items():
                lines.append(f"- {cat}: {cnt}")
        else:
            lines.append("- (none)")
        lines.append("")

    lines.append("## Portfolio Verdict")
    lines.append("")
    lines.append(f"**Overall:** {report['summary']['portfolio_verdict']}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("Steam Review Data Quality Check")
    print(f"Data directory: {DATA_DIR}")

    print_section("1. 파일 존재 여부")
    loaded_files: list[dict[str, Any]] = []
    for meta in FILES:
        path = DATA_DIR / meta["path"]
        exists = path.exists()
        status = "OK" if exists else "MISSING"
        print(f"  {meta['path']}: {status}")
        loaded_files.append(load_file(meta))

    global_id_map: dict[str, list[str]] = defaultdict(list)
    analyses: list[dict[str, Any]] = []

    print_section("2~12. 파일별 상세 검증")
    for file_result in loaded_files:
        analysis = analyze_file(file_result, global_id_map)
        analyses.append(analysis)
        print_file_report(analysis)

    cross_dupes = {
        rec_id: paths for rec_id, paths in global_id_map.items() if len(paths) > 1
    }
    cross_dupe_count = sum(len(paths) - 1 for paths in cross_dupes.values())

    print_section("4. 전체 파일 간 중복 (recommendationid)")
    print(f"  중복 ID 수: {len(cross_dupes)}")
    print(f"  중복 발생 건수(초과분 합계): {cross_dupe_count}")
    if cross_dupes:
        for rec_id, paths in list(cross_dupes.items())[:10]:
            print(f"    id={rec_id} -> {', '.join(paths)}")
        if len(cross_dupes) > 10:
            print(f"    ... 외 {len(cross_dupes) - 10}건")

    verdicts = [a.get("verdict", "NO GO") for a in analyses if a.get("loaded")]
    if all(v == "GO" for v in verdicts) and verdicts:
        portfolio_verdict = "GO"
    elif any(v == "NO GO" for v in verdicts) or not verdicts:
        portfolio_verdict = "PARTIAL GO" if any(v == "PARTIAL GO" for v in verdicts) else "NO GO"
    else:
        portfolio_verdict = "PARTIAL GO"

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "files_checked": len(FILES),
            "files_loaded": sum(1 for a in analyses if a.get("loaded")),
            "cross_file_duplicate_ids": len(cross_dupes),
            "cross_file_duplicate_count": cross_dupe_count,
            "portfolio_verdict": portfolio_verdict,
            "verdict_counts": dict(Counter(a.get("verdict", "NO GO") for a in analyses)),
        },
        "cross_file_duplicates": {
            rec_id: paths for rec_id, paths in list(cross_dupes.items())[:100]
        },
        "file_analyses": analyses,
    }

    json_path = DATA_DIR / "data_quality_report.json"
    md_path = DATA_DIR / "data_quality_report.md"
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with json_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    md_content = build_markdown_report(report)
    with md_path.open("w", encoding="utf-8") as f:
        f.write(md_content)

    print_section("13. 리포트 저장")
    print(f"  JSON: {json_path}")
    print(f"  MD:   {md_path}")
    print(f"\n[포트폴리오 최종 판정] {portfolio_verdict}")


if __name__ == "__main__":
    main()
