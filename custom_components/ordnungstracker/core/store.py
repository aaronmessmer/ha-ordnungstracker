"""Laden und Speichern der Inventardatei (Pflichtenheft 6).

Die Daten sind das Wertvollste am Projekt, deshalb:

* atomar schreiben (temporäre Datei, ``fsync``, dann ersetzen) – nie die bestehende Datei
  direkt überschreiben,
* kein blockierender Dateizugriff im Event-Loop (alles Blockierende läuft über ``to_thread``),
* Änderungen kurz sammeln und gebündelt schreiben; beim Beenden sofort (``async_stop``),
* alle schreibenden Operationen laufen durch eine gemeinsame Sperre,
* Sicherungskopien vor dem ersten Schreiben und danach höchstens stündlich,
* beim Laden prüfen; ist die Datei ungültig, wird nichts überschrieben,
* Änderungen von Hand erkennen (Neuladen oder Konfliktdatei).
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import shutil
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import timedelta
from enum import StrEnum
from pathlib import Path
from typing import Any, TypeVar

from . import backup as backup_mod
from . import jsonio
from .dates import Clock, system_clock
from .defaults import new_inventory_data
from .errors import (
    InvariantViolation,
    InventoryError,
    InventoryLoadError,
    NotFoundError,
    Problem,
)
from .inventory import Change, Inventory
from .journal import Journal
from .migrations import Migration, migrate
from .model import InventoryData
from .parse import parse_inventory
from .validation import validate_inventory

T = TypeVar("T")

FILE_NAME = "inventar.json"
JOURNAL_NAME = "verlauf.jsonl"
BACKUP_DIR = "sicherungen"
ATTACHMENT_DIR = "anhaenge"
SAVE_DELAY = 1.0
RETRY_DELAY = 10.0


class ExternalStatus(StrEnum):
    """Ergebnis der Prüfung auf Änderungen von außen (6.3)."""

    UNCHANGED = "unchanged"
    RELOADED = "reloaded"
    CONFLICT = "conflict"
    INVALID = "invalid"


@dataclass(slots=True)
class ExternalResult:
    status: ExternalStatus
    conflict_file: str | None = None
    problems: list[Problem] = field(default_factory=list)


def parse_inventory_text(
    text: str, migrations: dict[int, Migration] | None = None
) -> tuple[InventoryData, bool]:
    """Text der Datei -> geprüftes ``InventoryData``. Liefert ``(daten, wurde_migriert)``.

    Raises:
        InventoryLoadError: kaputtes JSON oder verletzte Regeln, mit allen Befunden.
        NewerSchemaError: Datei stammt von einer neueren Version.
    """
    try:
        raw = json.loads(text)
    except json.JSONDecodeError as err:
        problem = Problem(
            "json",
            f"Die Datei ist kein gültiges JSON (Zeile {err.lineno}, Spalte {err.colno}: {err.msg}). "
            "Typisch sind ein vergessenes Komma oder eine fehlende Klammer.",
        )
        raise InventoryLoadError(problem.message, [problem]) from err
    if not isinstance(raw, dict):
        problem = Problem("format", "Die Datei muss ein JSON-Objekt (in geschweiften Klammern) enthalten.")
        raise InventoryLoadError(problem.message, [problem])
    try:
        raw, migrated = migrate(raw, migrations)
    except InventoryLoadError:
        raise
    except InventoryError as err:
        if err.code == "newer_schema":
            raise
        problem = Problem("schema_version", err.message)
        raise InventoryLoadError(err.message, [problem]) from err
    data, problems = parse_inventory(raw)
    if data is not None:
        problems = validate_inventory(data)
    if problems or data is None:
        first = problems[0].message if problems else "unbekannter Fehler"
        more = f" (und {len(problems) - 1} weitere)" if len(problems) > 1 else ""
        raise InventoryLoadError(f"Die Inventardatei ist ungültig: {first}{more}", problems)
    return data, migrated


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def write_atomic(path: Path, text: str) -> None:
    """Datei atomar schreiben: temporäre Datei im selben Ordner, ``fsync``, ersetzen."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.tmp-{os.getpid()}")
    try:
        with tmp.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        tmp.replace(path)
    finally:
        if tmp.exists():
            tmp.unlink()
    try:
        dir_fd = os.open(path.parent, os.O_RDONLY)
    except OSError:  # pragma: no cover - z. B. Windows
        return
    try:
        os.fsync(dir_fd)
    except OSError:  # pragma: no cover
        pass
    finally:
        os.close(dir_fd)


class InventoryStore:
    """Hält das ``Inventory`` im Speicher und sichert es dauerhaft in ``inventar.json``."""

    def __init__(
        self,
        directory: Path,
        *,
        clock: Clock = system_clock,
        save_delay: float = SAVE_DELAY,
        backup_interval: timedelta = timedelta(hours=1),
        rng: Any = None,
    ) -> None:
        self.directory = directory
        self.path = directory / FILE_NAME
        self.backup_dir = directory / BACKUP_DIR
        self.journal = Journal(directory / JOURNAL_NAME)
        self.clock = clock
        self.save_delay = save_delay
        self.backup_interval = backup_interval
        self._rng = rng
        self._lock = asyncio.Lock()
        self._inventory: Inventory | None = None
        self._dirty = False
        self._pending: list[Change] = []
        self._timer: asyncio.TimerHandle | None = None
        self._signature: tuple[int, int, str] | None = None
        self._last_backup: Any = None
        self._blocked: str | None = None
        self.save_error: Exception | None = None

    # -- Zugriff --------------------------------------------------------------------------
    @property
    def inventory(self) -> Inventory:
        if self._inventory is None:
            raise RuntimeError("Das Inventar ist noch nicht geladen.")
        return self._inventory

    @property
    def dirty(self) -> bool:
        """Gibt es Änderungen, die noch nicht auf der Platte stehen?"""
        return self._dirty

    @property
    def blocked_reason(self) -> str | None:
        """Grund, warum gerade nicht geschrieben wird (Datei von Hand ungültig geändert)."""
        return self._blocked

    # -- Laden ----------------------------------------------------------------------------
    async def async_load(self) -> Inventory:
        """Inventar laden (oder bei erstem Start anlegen).

        Raises:
            InventoryLoadError: Datei ungültig; es wurde nichts verändert.
            NewerSchemaError: Datei stammt von einer neueren Version.
        """
        await asyncio.to_thread(self._prepare_dirs)
        exists = await asyncio.to_thread(self.path.exists)
        if not exists:
            data = new_inventory_data(self.clock().isoformat(timespec="seconds"))
            self._inventory = Inventory(data, clock=self.clock, rng=self._rng)
            self._dirty = True
            await self.async_flush()
            return self._inventory
        text = await asyncio.to_thread(self.path.read_text, "utf-8")
        try:
            data, migrated = parse_inventory_text(text)
        except InventoryLoadError as err:
            err.last_valid_backup = await asyncio.to_thread(self._last_valid_backup)
            raise
        if migrated:
            await asyncio.to_thread(self._copy_backup, "vor-migration")
        self._inventory = Inventory(data, clock=self.clock, rng=self._rng)
        self._signature = await asyncio.to_thread(self._read_signature)
        if migrated or self._inventory.normalizations:
            self._dirty = True
            await self.async_flush()
        return self._inventory

    def _prepare_dirs(self) -> None:
        for sub in (self.directory, self.backup_dir, self.directory / ATTACHMENT_DIR):
            sub.mkdir(parents=True, exist_ok=True)

    def _read_signature(self) -> tuple[int, int, str] | None:
        try:
            stat = self.path.stat()
            text = self.path.read_text("utf-8")
        except OSError:
            return None
        return (stat.st_mtime_ns, stat.st_size, _sha(text))

    def _last_valid_backup(self) -> str | None:
        for info in backup_mod.sort_newest_first(self._backup_infos()):
            try:
                parse_inventory_text((self.backup_dir / info.name).read_text("utf-8"))
            except InventoryError, OSError:
                continue
            return info.name
        return None

    def _backup_infos(self) -> list[backup_mod.BackupInfo]:
        if not self.backup_dir.exists():
            return []
        infos = (backup_mod.parse_backup_name(p.name) for p in self.backup_dir.iterdir())
        return [i for i in infos if i is not None]

    # -- Sicherungen ----------------------------------------------------------------------
    def _copy_backup(self, reason: str = "") -> str | None:
        """Aktuelle Datei nach ``sicherungen/`` kopieren und aufräumen (blockierend)."""
        if not self.path.exists():
            return None
        now = self.clock()
        counter = 0
        name = backup_mod.backup_name(now, reason)
        while (self.backup_dir / name).exists():
            counter += 1
            name = backup_mod.backup_name(now, reason, counter + 1)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(self.path, self.backup_dir / name)
        self._last_backup = now
        keep = backup_mod.select_to_keep(self._backup_infos(), now)
        for info in self._backup_infos():
            if info.name not in keep:
                (self.backup_dir / info.name).unlink(missing_ok=True)
        return name

    async def async_backup(self, reason: str = "manuell") -> str | None:
        """Sicherung der Datei auf der Platte anlegen (Dienst „Sicherung anlegen“)."""
        async with self._lock:
            await self._write_locked()
            return await asyncio.to_thread(self._copy_backup, reason)

    async def async_list_backups(self) -> list[backup_mod.BackupInfo]:
        return backup_mod.sort_newest_first(await asyncio.to_thread(self._backup_infos))

    async def async_restore_backup(self, name: str, user: str = "") -> Inventory:
        """Sicherung wiederherstellen; vorher wird der aktuelle Stand gesichert."""
        if backup_mod.parse_backup_name(name) is None:
            raise NotFoundError(f'"{name}" ist keine Sicherungsdatei.', name=name)
        path = self.backup_dir / name
        if not await asyncio.to_thread(path.exists):
            raise NotFoundError(f'Die Sicherung "{name}" gibt es nicht (mehr).', name=name)
        text = await asyncio.to_thread(path.read_text, "utf-8")
        return await self._replace_from_text(text, "vor-wiederherstellung", "restore", user, {"backup": name})

    async def async_import_text(self, text: str, user: str = "") -> Inventory:
        """Zuvor exportierte Datei einspielen. Ersetzt das Inventar nach Prüfung (8.10)."""
        return await self._replace_from_text(text, "vor-import", "import", user, {})

    async def _replace_from_text(
        self, text: str, reason: str, action: str, user: str, details: dict[str, Any]
    ) -> Inventory:
        data, _ = parse_inventory_text(text)  # wirft bei ungültiger Datei, ändert nichts
        async with self._lock:
            await self._write_locked()
            await asyncio.to_thread(self._copy_backup, reason)
            self.inventory.replace_data(data)
            self._blocked = None
            self._dirty = True
            self._pending = [Change(action, self.inventory.now(), user, details=details)]
            await self._write_locked()
            return self.inventory

    # -- Ändern ---------------------------------------------------------------------------
    async def async_mutate(self, func: Callable[[Inventory], T], user: str = "") -> T:
        """Eine Änderung ausführen: geprüft, protokolliert und gebündelt gespeichert.

        Verletzt das Ergebnis eine Regel aus 5.14, wird alles zurückgenommen.
        """
        async with self._lock:
            if self._blocked:
                raise InventoryError(self._blocked)
            inv = self.inventory
            inv.actor = user
            before = inv.data.to_dict()
            revision = inv.revision
            try:
                result = func(inv)
            except BaseException:
                if inv.revision != revision:
                    self._rollback(before)
                raise
            problems = validate_inventory(inv.data) if inv.revision != revision else []
            if problems:
                self._rollback(before)
                raise InvariantViolation(
                    "Die Änderung wurde zurückgenommen, weil sie das Inventar beschädigt hätte: "
                    + problems[0].message,
                    problems=[p.message for p in problems],
                )
            changes = inv.drain_changes()
            if changes:
                self._pending.extend(changes)
                self._dirty = True
                await self._schedule_save_locked()
            return result

    def _rollback(self, snapshot: dict[str, Any]) -> None:
        data, problems = parse_inventory(snapshot)
        if data is None:  # pragma: no cover - der Zwischenstand war gültig
            raise InventoryError(f"Zurücknehmen fehlgeschlagen: {problems[0].message}")
        self.inventory.replace_data(data)
        self.inventory.drain_changes()

    # -- Speichern ------------------------------------------------------------------------
    async def _schedule_save_locked(self) -> None:
        if self.save_delay <= 0:
            await self._write_locked()
            return
        if self._timer is None:
            loop = asyncio.get_running_loop()
            self._timer = loop.call_later(self.save_delay, self._timer_fired)

    def _timer_fired(self) -> None:
        self._timer = None
        loop = asyncio.get_running_loop()
        loop.create_task(self.async_flush())  # noqa: RUF006

    async def async_flush(self) -> None:
        """Sofort schreiben, was noch aussteht."""
        async with self._lock:
            await self._write_locked()

    async def async_stop(self) -> None:
        """Beim Beenden von Home Assistant: sofort schreiben, Timer abbrechen."""
        await self.async_flush()

    async def _write_locked(self) -> None:
        if self._timer is not None:
            self._timer.cancel()
            self._timer = None
        if self._blocked or not (self._dirty or self._pending):
            return
        snapshot = self.inventory.data.to_dict()  # schnell; das Formatieren läuft im Thread
        entries = [c.to_journal() for c in self._pending]
        pending, self._pending = self._pending, []
        now = self.clock()
        make_backup = self.path.exists() and (
            self._last_backup is None or now - self._last_backup >= self.backup_interval
        )
        try:
            text = await asyncio.to_thread(self._write_all, snapshot, entries, make_backup)
        except OSError as err:
            self._pending = pending + self._pending
            self.save_error = err
            loop = asyncio.get_running_loop()
            self._timer = loop.call_later(RETRY_DELAY, self._timer_fired)
            return
        self.save_error = None
        self._dirty = False
        self._signature = (self.path.stat().st_mtime_ns, len(text.encode("utf-8")), _sha(text))

    def _write_all(
        self, snapshot: dict[str, Any], journal_entries: list[dict[str, Any]], make_backup: bool
    ) -> str:
        """Sicherung, Datei und Protokoll schreiben (blockierend, im Thread). Liefert den Text."""
        text = jsonio.dumps(snapshot)
        if make_backup:
            self._copy_backup()
        write_atomic(self.path, text)
        self.journal.append(journal_entries)
        return text

    # -- Änderungen von außen -------------------------------------------------------------
    async def async_check_external(self, *, force: bool = False) -> ExternalResult:
        """Wurde die Datei außerhalb verändert? Dann neu laden oder Konfliktdatei anlegen (6.3)."""
        async with self._lock:
            current = await asyncio.to_thread(self._read_signature)
            if current is None:
                return ExternalResult(ExternalStatus.UNCHANGED)
            if not force and self._signature is not None and current[2] == self._signature[2]:
                self._signature = current
                if self._blocked:
                    self._blocked = None
                return ExternalResult(ExternalStatus.UNCHANGED)
            text = await asyncio.to_thread(self.path.read_text, "utf-8")
            conflict_name: str | None = None
            try:
                data, _ = parse_inventory_text(text)
            except InventoryError as err:
                problems = getattr(err, "problems", [Problem("schema", err.message)])
                self._blocked = (
                    "Die Datei inventar.json wurde von Hand geändert und ist jetzt ungültig: "
                    f"{err.message} Korrigiere die Datei oder stelle eine Sicherung wieder her. "
                    "Bis dahin werden keine Änderungen gespeichert."
                )
                if self._dirty:
                    conflict_name = await asyncio.to_thread(self._write_conflict)
                self._signature = current
                return ExternalResult(ExternalStatus.INVALID, conflict_name, list(problems))
            status = ExternalStatus.RELOADED
            if self._dirty:
                conflict_name = await asyncio.to_thread(self._write_conflict)
                status = ExternalStatus.CONFLICT
            self.inventory.replace_data(data)
            self._dirty = False
            self._pending = []
            self._blocked = None
            self._signature = current
            return ExternalResult(status, conflict_name)

    def _write_conflict(self) -> str:
        """Eigenen, noch nicht gespeicherten Stand neben die Datei legen (blockierend)."""
        name = f"inventar.konflikt-{self.clock():%Y%m%d-%H%M%S}.json"
        write_atomic(self.directory / name, jsonio.dumps(self.inventory.data.to_dict()))
        return name

    # -- Pflege ---------------------------------------------------------------------------
    async def async_housekeeping(self) -> int:
        """Täglich aufzurufen: Papierkorb-Einträge nach 30 Tagen endgültig entfernen."""
        return await self.async_mutate(lambda inv: inv.purge_expired_trash(), "system")

    async def async_journal(
        self, node_id: str | None = None, limit: int = 100, offset: int = 0
    ) -> list[dict[str, Any]]:
        """Änderungsprotokoll lesen, neueste zuerst (6.4)."""
        await self.async_flush()
        return await asyncio.to_thread(self.journal.read, node_id, limit, offset)

    async def async_export_text(self) -> str:
        """Aktueller Stand als Text von ``inventar.json`` (Export, 8.10)."""
        snapshot = self.inventory.data.to_dict()
        return await asyncio.to_thread(jsonio.dumps, snapshot)
