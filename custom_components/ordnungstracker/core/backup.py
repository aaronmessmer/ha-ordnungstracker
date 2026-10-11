"""Sicherungskopien von ``inventar.json`` (Pflichtenheft 6.3).

Aufbewahrt werden die letzten 20 Kopien sowie je eine pro Tag für die letzten 30 Tage.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timedelta

KEEP_LAST = 20
KEEP_DAYS = 30
_NAME_RE = re.compile(r"^inventar-(\d{8}-\d{6})(?:-(\d+))?(?:-([a-z0-9-]+))?\.json$")


@dataclass(frozen=True, slots=True)
class BackupInfo:
    """Eine Sicherungsdatei; ``reason`` z. B. ``vor-migration-v1``."""

    name: str
    time: datetime
    reason: str = ""


def backup_name(moment: datetime, reason: str = "", counter: int = 0) -> str:
    """Dateiname einer Sicherung, z. B. ``inventar-20261010-091244.json``."""
    suffix = f"-{counter}" if counter else ""
    tag = f"-{reason}" if reason else ""
    return f"inventar-{moment:%Y%m%d-%H%M%S}{suffix}{tag}.json"


def parse_backup_name(name: str) -> BackupInfo | None:
    match = _NAME_RE.match(name)
    if match is None:
        return None
    return BackupInfo(name, datetime.strptime(match.group(1), "%Y%m%d-%H%M%S"), match.group(3) or "")


def sort_newest_first(infos: list[BackupInfo]) -> list[BackupInfo]:
    return sorted(infos, key=lambda i: (i.time, i.name), reverse=True)


def select_to_keep(infos: list[BackupInfo], now: datetime) -> set[str]:
    """Namen der Sicherungen, die bleiben (die letzten 20 und je eine pro Tag der letzten 30 Tage)."""
    ordered = sort_newest_first(infos)
    keep = {i.name for i in ordered[:KEEP_LAST]}
    limit = now.replace(tzinfo=None) - timedelta(days=KEEP_DAYS)
    seen_days: set[str] = set()
    for info in ordered:  # neueste je Tag zuerst
        day = info.time.strftime("%Y%m%d")
        if info.time < limit.replace(hour=0, minute=0, second=0, microsecond=0) or day in seen_days:
            continue
        seen_days.add(day)
        keep.add(info.name)
    return keep
