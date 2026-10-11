"""Kette von Migrationen der Inventardatei (Pflichtenheft 6.3).

Jede Funktion hebt die Datei von Version *n* auf *n + 1* an. Eine Datei mit neuerer Version
als die Integration wird nicht angefasst.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from typing import Any

from .errors import InventoryError, NewerSchemaError
from .model import SCHEMA_VERSION

Migration = Callable[[dict[str, Any]], dict[str, Any]]

# Schlüssel = Version, von der aus migriert wird. Aktuell ist Version 1 die erste und einzige.
MIGRATIONS: dict[int, Migration] = {}


def file_version(raw: Any) -> int:
    """Version aus rohem JSON lesen; fehlt sie oder ist sie unbrauchbar, gilt die Datei als ungültig."""
    version = raw.get("schema_version") if isinstance(raw, dict) else None
    if isinstance(version, bool) or not isinstance(version, int) or version < 1:
        raise InventoryError(
            'In der Datei fehlt "schema_version" (eine ganze Zahl ab 1) oder sie ist ungültig.'
        )
    return version


def needs_migration(raw: Any, current: int = SCHEMA_VERSION) -> bool:
    return file_version(raw) < current


def migrate(
    raw: dict[str, Any],
    migrations: Mapping[int, Migration] | None = None,
    current: int = SCHEMA_VERSION,
) -> tuple[dict[str, Any], bool]:
    """Datei auf die aktuelle Version bringen. Liefert ``(daten, wurde_migriert)``."""
    chain = MIGRATIONS if migrations is None else migrations
    version = file_version(raw)
    if version > current:
        raise NewerSchemaError(
            f"Die Datei hat das Format {version}, diese Version des Ordnungs-Trackers kennt aber "
            f"nur bis {current}. Die Datei wird nicht verändert. Aktualisiere die Integration "
            "über HACS.",
            file_version=version,
            supported=current,
        )
    migrated = False
    while version < current:
        step = chain.get(version)
        if step is None:
            raise InventoryError(
                f"Für das Dateiformat {version} gibt es keine Migration auf {version + 1}. "
                "Stelle eine Sicherung wieder her oder melde den Fehler im Repository.",
                file_version=version,
            )
        raw = step(raw)
        version += 1
        raw["schema_version"] = version
        migrated = True
    return raw, migrated
