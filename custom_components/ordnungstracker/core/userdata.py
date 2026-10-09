"""Kleine Hilfsdateien: ``benutzer.json`` (pro HA-Benutzer) und ``zustand.json`` (Merker).

Beides ist weniger wertvoll als das Inventar, wird aber ebenfalls atomar geschrieben. Eine
kaputte Datei wird beiseitegelegt (``….kaputt``) statt überschrieben.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from .store import write_atomic

MAX_RECENT = 20
MAX_TARGETS = 8


class JsonDocument:
    """Ein kleines JSON-Dokument mit sofortigem, atomarem Speichern."""

    def __init__(self, path: Path, default: dict[str, Any]) -> None:
        self.path = path
        self._default = default
        self.data: dict[str, Any] = json.loads(json.dumps(default))
        self._lock = asyncio.Lock()

    async def async_load(self) -> None:
        def read() -> dict[str, Any] | None:
            if not self.path.exists():
                return None
            try:
                value = json.loads(self.path.read_text("utf-8"))
            except OSError, json.JSONDecodeError:
                self.path.replace(self.path.with_name(self.path.name + ".kaputt"))
                return None
            return value if isinstance(value, dict) else None

        loaded = await asyncio.to_thread(read)
        if loaded is not None:
            self.data = {**json.loads(json.dumps(self._default)), **loaded}

    async def async_save(self) -> None:
        async with self._lock:
            text = json.dumps(self.data, ensure_ascii=False, indent=2) + "\n"
            await asyncio.to_thread(write_atomic, self.path, text)


class UserData(JsonDocument):
    """Favoriten, zuletzt Angesehenes und Ansichtsvorlieben je HA-Benutzer (8.12)."""

    def __init__(self, path: Path) -> None:
        super().__init__(path, {"users": {}})

    def _user(self, user_id: str) -> dict[str, Any]:
        users: dict[str, Any] = self.data.setdefault("users", {})
        user: dict[str, Any] = users.setdefault(
            user_id,
            {"favorites": [], "recent": [], "recent_targets": [], "view": {}, "stocktake": {}},
        )
        user.setdefault("recent_targets", [])  # Dateien aus älteren Versionen
        return user

    def favorites(self, user_id: str) -> list[str]:
        return list(self._user(user_id)["favorites"])

    def recent(self, user_id: str) -> list[str]:
        return list(self._user(user_id)["recent"])

    async def async_set_favorite(self, user_id: str, node_id: str, value: bool) -> list[str]:
        favorites: list[str] = self._user(user_id)["favorites"]
        if value and node_id not in favorites:
            favorites.append(node_id)
        if not value and node_id in favorites:
            favorites.remove(node_id)
        await self.async_save()
        return list(favorites)

    async def async_add_recent(self, user_id: str, node_id: str) -> list[str]:
        recent: list[str] = self._user(user_id)["recent"]
        if node_id in recent:
            recent.remove(node_id)
        recent.insert(0, node_id)
        del recent[MAX_RECENT:]
        await self.async_save()
        return list(recent)

    def recent_targets(self, user_id: str) -> list[str]:
        """Zuletzt verwendete Ziele beim Verschieben (8.4), neuestes zuerst."""
        return list(self._user(user_id)["recent_targets"])

    async def async_add_target(self, user_id: str, node_id: str) -> list[str]:
        targets: list[str] = self._user(user_id)["recent_targets"]
        if node_id in targets:
            targets.remove(node_id)
        targets.insert(0, node_id)
        del targets[MAX_TARGETS:]
        await self.async_save()
        return list(targets)

    async def async_set_view(self, user_id: str, key: str, value: Any) -> None:
        self._user(user_id)["view"][key] = value
        await self.async_save()

    def view(self, user_id: str) -> dict[str, Any]:
        return dict(self._user(user_id)["view"])

    async def async_set_stocktake(self, user_id: str, node_id: str, state: dict[str, Any] | None) -> None:
        """Begonnene Inventur eines Knotens merken (bleibt beim Verlassen der Ansicht erhalten, 8.9)."""
        stocktakes: dict[str, Any] = self._user(user_id)["stocktake"]
        if state is None:
            stocktakes.pop(node_id, None)
        else:
            stocktakes[node_id] = state
        await self.async_save()

    def stocktake(self, user_id: str, node_id: str) -> dict[str, Any] | None:
        value = self._user(user_id)["stocktake"].get(node_id)
        return dict(value) if isinstance(value, dict) else None

    async def async_prune(self, valid_ids: set[str]) -> int:
        """Verweise auf nicht mehr vorhandene Knoten entfernen. Liefert die Zahl entfernter Verweise."""
        removed = 0
        for user in self.data.get("users", {}).values():
            for key in ("favorites", "recent", "recent_targets"):
                kept = [i for i in user.get(key, []) if i in valid_ids]
                removed += len(user.get(key, [])) - len(kept)
                user[key] = kept
            for node_id in [n for n in user.get("stocktake", {}) if n not in valid_ids]:
                del user["stocktake"][node_id]
                removed += 1
        if removed:
            await self.async_save()
        return removed


class StateData(JsonDocument):
    """Interner Merker, z. B. welche Fälligkeiten schon gemeldet wurden (9.6)."""

    def __init__(self, path: Path) -> None:
        super().__init__(path, {"reported": []})

    @property
    def reported(self) -> set[str]:
        return set(self.data.get("reported", []))

    async def async_set_reported(self, keys: set[str]) -> None:
        self.data["reported"] = sorted(keys)
        await self.async_save()
