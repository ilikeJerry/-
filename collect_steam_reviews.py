#!/usr/bin/env python3
"""Steam Review API를 사용해 지정 게임의 positive/negative 리뷰를 수집합니다."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import requests

BASE_URL = "https://store.steampowered.com/appreviews/{app_id}"
DATA_DIR = Path(__file__).resolve().parent / "data"
NUM_PER_PAGE = 100
REQUEST_DELAY_SEC = 1
MAX_RETRIES = 3
REQUEST_TIMEOUT_SEC = 30

GAMES = [
    {
        "game": "Brawlhalla",
        "slug": "brawlhalla",
        "app_id": 291550,
        "targets": [("negative", 500), ("positive", 200)],
    },
    {
        "game": "Stumble Guys",
        "slug": "stumble_guys",
        "app_id": 1677740,
        "targets": [("negative", 500), ("positive", 200)],
    },
    {
        "game": "Goose Goose Duck",
        "slug": "goose_goose_duck",
        "app_id": 1568590,
        "targets": [("negative", 500), ("positive", 200)],
    },
]


def fetch_page(app_id: int, review_type: str, cursor: str) -> dict[str, Any] | None:
    url = BASE_URL.format(app_id=app_id)
    params = {
        "json": 1,
        "filter": "recent",
        "language": "all",
        "review_type": review_type,
        "purchase_type": "all",
        "num_per_page": NUM_PER_PAGE,
        "cursor": cursor,
    }
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(
                url, params=params, timeout=REQUEST_TIMEOUT_SEC
            )
            response.raise_for_status()
            payload = response.json()
            if payload.get("success") != 1:
                raise ValueError(f"API success != 1: {payload.get('success')}")
            return payload
        except (requests.RequestException, ValueError, json.JSONDecodeError) as exc:
            last_error = exc
            print(
                f"    [재시도 {attempt}/{MAX_RETRIES}] 요청 실패: {exc}"
            )
            if attempt < MAX_RETRIES:
                time.sleep(REQUEST_DELAY_SEC)

    print(f"    [포기] 페이지 수집 실패: {last_error}")
    return None


def transform_review(raw: dict[str, Any]) -> dict[str, Any] | None:
    body = (raw.get("review") or "").strip()
    if not body:
        return None

    author = raw.get("author") or {}
    return {
        "recommendationid": str(raw.get("recommendationid", "")),
        "language": raw.get("language", ""),
        "review": body,
        "voted_up": bool(raw.get("voted_up", False)),
        "timestamp_created": raw.get("timestamp_created", 0),
        "timestamp_updated": raw.get("timestamp_updated", 0),
        "playtime_forever": author.get("playtime_forever", 0),
        "playtime_at_review": author.get("playtime_at_review", 0),
        "votes_up": raw.get("votes_up", 0),
        "votes_funny": raw.get("votes_funny", 0),
        "weighted_vote_score": raw.get("weighted_vote_score", 0.0),
        "steam_purchase": bool(raw.get("steam_purchase", False)),
        "received_for_free": bool(raw.get("received_for_free", False)),
    }


def collect_reviews(
    game_name: str,
    app_id: int,
    review_type: str,
    target_count: int,
) -> list[dict[str, Any]]:
    seen_ids: set[str] = set()
    unique_reviews: list[dict[str, Any]] = []
    cursor = "*"
    page = 0

    print(
        f"  수집 시작: {review_type}, 목표 {target_count}개 "
        f"(예상 최소 {(target_count + NUM_PER_PAGE - 1) // NUM_PER_PAGE}페이지)"
    )

    while len(unique_reviews) < target_count:
        page += 1
        print(
            f"    페이지 {page} 요청 중... (현재 {len(unique_reviews)}/{target_count})"
        )

        payload = fetch_page(app_id, review_type, cursor)
        time.sleep(REQUEST_DELAY_SEC)

        if payload is None:
            print("    더 이상 진행할 수 없어 수집을 중단합니다.")
            break

        raw_reviews = payload.get("reviews") or []
        next_cursor = payload.get("cursor", "")
        added = 0
        skipped_empty = 0
        skipped_dup = 0

        for raw in raw_reviews:
            rec_id = str(raw.get("recommendationid", ""))
            if not rec_id or rec_id in seen_ids:
                if rec_id:
                    skipped_dup += 1
                continue

            transformed = transform_review(raw)
            if transformed is None:
                skipped_empty += 1
                continue

            seen_ids.add(rec_id)
            unique_reviews.append(transformed)
            added += 1

            if len(unique_reviews) >= target_count:
                break

        print(
            f"    페이지 {page} 완료: +{added}개 "
            f"(중복 제외 {skipped_dup}, 빈 본문 제외 {skipped_empty}) "
            f"→ 누적 {len(unique_reviews)}/{target_count}"
        )

        if not raw_reviews or not next_cursor or next_cursor == cursor:
            print("    더 이상 불러올 리뷰가 없습니다.")
            break

        cursor = next_cursor

    if len(unique_reviews) < target_count:
        print(
            f"  [경고] 목표 미달: {len(unique_reviews)}/{target_count}개만 수집됨"
        )
    else:
        print(f"  수집 완료: {len(unique_reviews)}개")

    return unique_reviews[:target_count]


def save_reviews(
    output_path: Path,
    game: str,
    app_id: int,
    review_type: str,
    target_count: int,
    reviews: list[dict[str, Any]],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    document = {
        "game": game,
        "appId": app_id,
        "reviewType": review_type,
        "targetCount": target_count,
        "actualCount": len(reviews),
        "source": "steam_reviews",
        "reviews": reviews,
    }
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(document, f, ensure_ascii=False, indent=2)
    print(f"  저장 완료: {output_path} ({len(reviews)}개)")


def process_game(game_cfg: dict[str, Any]) -> None:
    game_name = game_cfg["game"]
    slug = game_cfg["slug"]
    app_id = game_cfg["app_id"]

    print(f"\n{'=' * 60}")
    print(f"게임: {game_name} (App ID: {app_id})")
    print(f"{'=' * 60}")

    for review_type, target_count in game_cfg["targets"]:
        output_name = f"{slug}_{review_type}_{target_count}.json"
        output_path = DATA_DIR / output_name

        try:
            reviews = collect_reviews(
                game_name=game_name,
                app_id=app_id,
                review_type=review_type,
                target_count=target_count,
            )
            save_reviews(
                output_path=output_path,
                game=game_name,
                app_id=app_id,
                review_type=review_type,
                target_count=target_count,
                reviews=reviews,
            )
        except Exception as exc:
            print(f"  [오류] {output_name} 처리 중 예외 발생: {exc}")
            print("  다음 작업으로 계속합니다.")


def main() -> None:
    print("Steam Review API 리뷰 수집을 시작합니다.")
    print(f"저장 경로: {DATA_DIR}")

    for game_cfg in GAMES:
        try:
            process_game(game_cfg)
        except Exception as exc:
            print(
                f"\n[오류] {game_cfg['game']} 처리 중 예외: {exc}"
            )
            print("다음 게임으로 계속합니다.")

    print(f"\n{'=' * 60}")
    print("전체 작업이 종료되었습니다.")
    print(f"{'=' * 60}")
    print_summary()


def print_summary() -> None:
    expected = [
        ("brawlhalla_negative_500.json", 500),
        ("brawlhalla_positive_200.json", 200),
        ("stumble_guys_negative_500.json", 500),
        ("stumble_guys_positive_200.json", 200),
        ("goose_goose_duck_negative_500.json", 500),
        ("goose_goose_duck_positive_200.json", 200),
    ]
    print("\n[수집 결과 요약]")
    for filename, target in expected:
        path = DATA_DIR / filename
        if not path.exists():
            print(f"- {filename} | 목표: {target} | 실제: 0 | 상태: 실패 (파일 없음)")
            continue
        try:
            with path.open(encoding="utf-8") as f:
                data = json.load(f)
            actual = data.get("actualCount", len(data.get("reviews", [])))
            ok = actual >= target
            status = "성공" if ok else "실패 (목표 미달)"
            print(
                f"- {filename} | 목표: {target} | 실제: {actual} | 상태: {status}"
            )
        except Exception as exc:
            print(f"- {filename} | 목표: {target} | 실제: - | 상태: 실패 ({exc})")


if __name__ == "__main__":
    main()
