"""Datumsrechnung für Wartung, Erinnerungen und Papierkorb."""

from __future__ import annotations

import calendar
from collections.abc import Callable
from datetime import date, datetime, timedelta

from .model import Interval, IntervalUnit

Clock = Callable[[], datetime]


def system_clock() -> datetime:
    """Aktuelle Zeit mit Zeitzone des Systems."""
    return datetime.now().astimezone()


def to_date(value: str) -> date:
    """``JJJJ-MM-TT`` (oder ein Zeitstempel) als Datum."""
    return date.fromisoformat(value[:10])


def parse_stamp(value: str) -> datetime:
    """ISO-Zeitstempel; reine Datumsangaben gelten als 00:00 Uhr (ohne Zeitzone)."""
    return datetime.fromisoformat(value)


def add_months(day: date, months: int) -> date:
    """Monate addieren; zu kurze Monate werden auf den letzten Tag begrenzt (31.1. + 1 Monat = 28.2.)."""
    index = day.year * 12 + (day.month - 1) + months
    year, month = divmod(index, 12)
    month += 1
    last = calendar.monthrange(year, month)[1]
    return date(year, month, min(day.day, last))


def add_interval(day: date, interval: Interval) -> date:
    """Nächste Fälligkeit nach ``interval`` ab ``day``."""
    if interval.unit is IntervalUnit.DAYS:
        return day + timedelta(days=interval.value)
    if interval.unit is IntervalUnit.WEEKS:
        return day + timedelta(weeks=interval.value)
    if interval.unit is IntervalUnit.MONTHS:
        return add_months(day, interval.value)
    return add_months(day, 12 * interval.value)
