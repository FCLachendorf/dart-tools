#!/usr/bin/env python3
"""Refresh the small, privacy-minimised 3K fallback used by GitHub Pages.

The live browser request remains the primary source. This script stores only
team-level values needed by the announcement generator so a temporary 3K/CORS
outage does not blank the comparison.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://backend-ddv.3k-darts.com/2k-backend-ddv/api/v1/frontend/event/"
EVENTS = (1428, 1422)
CACHE_PATH = Path("data/3k-cache.json")
TIMEOUT = 20


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_json(path: str):
    request = urllib.request.Request(
        BASE + path,
        headers={
            "Accept": "application/json",
            "User-Agent": "FC-Lachendorf-Darts-Tools/1.0 (+https://fclachendorf.github.io/dart-tools/)",
        },
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}")
        return json.load(response)


def table_rows(data):
    groups = data.get("tableEntries") if isinstance(data, dict) else None
    if not isinstance(groups, list):
        raise ValueError("tableEntries missing")
    rows = []
    for group in groups:
        entries = group.get("tableEntries") if isinstance(group, dict) else None
        if isinstance(entries, list):
            rows.extend(entries)
    return rows


def table_stats(rows, participant_id):
    row = next((item for item in rows if item.get("participantId") == participant_id), None)
    if row is None:
        raise ValueError(f"participant {participant_id} missing from table")
    placement = row.get("placement")
    if isinstance(placement, str):
        placement = placement.rstrip(".")
    return {
        "place": placement,
        "points": row.get("points1"),
        "games": row.get("matchCount"),
    }


def performance_stats(data):
    catalog = data.get("performanceCatalog") if isinstance(data, dict) else None
    if not isinstance(catalog, list):
        raise ValueError("performanceCatalog missing")

    finishes = []
    counters = 0
    for category in catalog:
        if not isinstance(category, dict):
            continue
        code = category.get("performanceTypeCd")
        performances = category.get("playerPerformances")
        if not isinstance(performances, list):
            continue
        if code == "HF":
            for item in performances:
                value = item.get("value") if isinstance(item, dict) else None
                if isinstance(value, (int, float)) and 101 <= value <= 170:
                    finishes.append(value)
        elif code == "HS":
            for item in performances:
                if not isinstance(item, dict) or item.get("value") != 180:
                    continue
                try:
                    counters += int(item.get("count") or 0)
                except (TypeError, ValueError):
                    pass

    return {
        "finish": max(finishes) if finishes else None,
        "counter": counters,
        "performanceKnown": True,
    }


def read_existing():
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {"version": 1, "updatedAt": None, "events": {}}


def participant_without_runtime_fields(item):
    if not isinstance(item, dict):
        return {}
    return {
        "participantId": item.get("participantId"),
        "displayName": item.get("displayName"),
        "place": item.get("place"),
        "points": item.get("points"),
        "games": item.get("games"),
        "finish": item.get("finish"),
        "counter": item.get("counter"),
        "performanceKnown": bool(item.get("performanceKnown")),
    }


def build_event(event_id: int, old_event: dict):
    table = fetch_json(f"{event_id}/phase/0/round/0/table")
    participants = fetch_json(f"{event_id}/participant")
    if not isinstance(participants, list):
        raise ValueError("participants is not a list")

    rows = table_rows(table)
    old_participants = old_event.get("participants", {}) if isinstance(old_event, dict) else {}
    result = {}

    for participant in participants:
        if not isinstance(participant, dict):
            continue
        participant_id = participant.get("id")
        display_name = participant.get("displayName")
        if participant_id is None or not display_name:
            continue

        try:
            stats = table_stats(rows, participant_id)
        except ValueError:
            continue

        old = participant_without_runtime_fields(old_participants.get(str(participant_id), {}))
        item = {
            "participantId": participant_id,
            "displayName": display_name,
            **stats,
            "finish": old.get("finish"),
            "counter": old.get("counter"),
            "performanceKnown": bool(old.get("performanceKnown")),
        }

        team = participant.get("team")
        team_id = team.get("id") if isinstance(team, dict) else None
        if team_id is not None:
            try:
                item.update(performance_stats(fetch_json(f"{event_id}/performance?teamId={team_id}")))
            except Exception as exc:  # retain the last known team-level best performances
                print(f"warning: event {event_id}, team {team_id}: performance refresh failed: {exc}")

        result[str(participant_id)] = item

    if not result:
        raise ValueError("no usable participants")

    comparable_old = {
        key: participant_without_runtime_fields(value)
        for key, value in old_participants.items()
        if isinstance(value, dict)
    }
    changed = result != comparable_old

    return {
        "updatedAt": now_iso() if changed or not old_event.get("updatedAt") else old_event["updatedAt"],
        "participants": result,
    }, changed


def main() -> int:
    existing = read_existing()
    old_events = existing.get("events", {}) if isinstance(existing.get("events"), dict) else {}
    events = dict(old_events)
    any_change = False
    any_success = False

    for event_id in EVENTS:
        key = str(event_id)
        old_event = old_events.get(key, {})
        try:
            event, changed = build_event(event_id, old_event)
        except Exception as exc:
            print(f"warning: event {event_id}: refresh failed, keeping previous snapshot: {exc}")
            continue
        events[key] = event
        any_change = any_change or changed or key not in old_events
        any_success = True

    if not any_success:
        print("No 3K event could be refreshed; existing cache remains untouched.")
        return 0

    if not any_change:
        print("3K values are unchanged; no cache update needed.")
        return 0

    output = {
        "version": 1,
        "updatedAt": now_iso(),
        "events": events,
    }
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("Updated", CACHE_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main())
