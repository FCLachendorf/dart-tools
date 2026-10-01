#!/usr/bin/env python3
"""Refresh the small, privacy-minimised 3K fallback used by GitHub Pages.

The live browser request remains the primary source. This script stores only
team-level values needed by the announcement generator so a temporary 3K/CORS
outage does not blank the comparison.
"""

from __future__ import annotations

import json
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://backend-ddv.3k-darts.com/2k-backend-ddv/api/v1/frontend/event/"
CONFIG_PATH = Path("data/3k-leagues.json")
CACHE_PATH = Path("data/3k-cache.json")
TIMEOUT = 12


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
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                if response.status != 200:
                    raise RuntimeError(f"HTTP {response.status}")
                return json.load(response)
        except (OSError, ValueError, RuntimeError):
            if attempt:
                raise
            time.sleep(1)


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
    row = next((item for item in rows if str(item.get("participantId", item.get("participant", {}).get("id"))) == str(participant_id)), None)
    if row is None:
        raise ValueError(f"participant {participant_id} missing from table")
    placement = row.get("placement")
    if isinstance(placement, str):
        placement = placement.rstrip(".")
    try:
        if float(placement) < 1 or not float(placement).is_integer() or not float(row.get("matchCount")).is_integer() or float(row.get("matchCount")) < 0:
            raise ValueError("invalid table values")
        float(row.get("points1"))
    except (TypeError, ValueError) as exc:
        raise ValueError(f"invalid table row for {participant_id}") from exc
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


def normalized_name(value):
    value = unicodedata.normalize("NFD", str(value or "").lower().replace("ß", "ss"))
    return "".join(c for c in value if c.isascii() and c.isalnum())


def build_event(event_id: int, old_event: dict):
    table = fetch_json(f"{event_id}/phase/0/round/0/table")
    participants = fetch_json(f"{event_id}/participant")
    if not isinstance(participants, list):
        raise ValueError("participants is not a list")

    rows = table_rows(table)
    old_participants = old_event.get("participants", {}) if isinstance(old_event, dict) else {}
    result = {}
    partial = False
    checked_at = now_iso()

    for participant in participants:
        if not isinstance(participant, dict):
            continue
        participant_id = participant.get("id")
        display_name = participant.get("displayName")
        if participant_id is None or not display_name:
            continue

        try:
            stats = table_stats(rows, participant_id)
        except ValueError as exc:
            # An incomplete table must not replace the last complete event.
            raise ValueError(f"incomplete table: {exc}") from exc

        old = old_participants.get(str(participant_id), {})
        item = {
            "participantId": participant_id,
            "displayName": display_name,
            **stats,
            "finish": old.get("finish"),
            "counter": old.get("counter"),
            "performanceKnown": bool(old.get("performanceKnown")),
            "performanceCheckedAt": old.get("performanceCheckedAt") or (old_event.get("updatedAt") if old.get("performanceKnown") else None),
            "performanceStale": True,
        }

        team = participant.get("team")
        team_id = team.get("id") if isinstance(team, dict) else None
        if team_id is not None:
            try:
                item.update(performance_stats(fetch_json(f"{event_id}/performance?teamId={team_id}")))
                item["performanceCheckedAt"] = now_iso()
                item["performanceStale"] = False
            except Exception as exc:  # retain the last known team-level best performances
                print(f"::warning::event {event_id}, team {team_id}: performance refresh failed: {exc}")
        if item["performanceStale"]:
            partial = True

        result[str(participant_id)] = item

    if not result:
        raise ValueError("no usable participants")

    return {
        "updatedAt": checked_at,
        "checkedAt": checked_at,
        "participants": result,
    }, partial


def main() -> int:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    leagues = config.get("leagues", {})
    if not all(isinstance(leagues.get(team, {}).get("event"), int)
               and leagues[team]["event"] > 0 and leagues[team].get("ownName") for team in ("a", "b")):
        raise ValueError("Missing or invalid A/B league configuration")
    existing = read_existing()
    old_events = existing.get("events", {}) if isinstance(existing.get("events"), dict) else {}
    events = dict(old_events)
    any_success = False
    failed = False

    for event_id in sorted({league["event"] for league in leagues.values()}):
        key = str(event_id)
        old_event = old_events.get(key, {})
        try:
            event, partial = build_event(event_id, old_event)
            for league in leagues.values():
                if league["event"] != event_id:
                    continue
                matches = [p for p in event["participants"].values()
                           if normalized_name(p["displayName"]) == normalized_name(league["ownName"])]
                if len(matches) != 1:
                    raise ValueError(f"Own team not uniquely present: {league['ownName']}")
        except Exception as exc:
            print(f"::error::event {event_id}: refresh failed, keeping previous snapshot: {exc}")
            failed = True
            continue
        events[key] = event
        failed = failed or partial
        any_success = True

    if not any_success:
        print("No 3K event could be refreshed; existing cache remains untouched.")
        return 1

    output = {"version": 2, "updatedAt": now_iso(), "events": events}
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("Updated", CACHE_PATH)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
