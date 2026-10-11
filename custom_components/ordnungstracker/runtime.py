"""Laufzeit der Integration: Speicher, Suchindex, Benutzerdaten, Takte, Ereignisse.

Dünne Schicht zwischen Home Assistant und Kern (Pflichtenheft 4): Sie verwaltet nur Lebensdauer,
Zeitgeber und Meldungen; die Fachlogik bleibt im Kern.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import timedelta
from pathlib import Path
from typing import Any, TypeVar

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_time_interval

from . import repairs
from .const import (
    CONF_ADMIN_ONLY,
    CONF_TODO_AUTO,
    CONF_TODO_ENTITY,
    DATA_DIR_NAME,
    DOMAIN,
    EVENT_DUE,
    EXTERNAL_CHECK_SECONDS,
    HOURLY_SECONDS,
    ISSUE_CONFLICT,
    ISSUE_EXTERNAL_INVALID,
    ISSUE_SAVE_FAILED,
    SENSOR_ITEM_LIMIT,
)
from .core.inventory import Change, Inventory
from .core.overview import Overview, build_overview
from .core.present import due_dict
from .core.reminders import Category, calendar_events, list_checkouts, new_due_items
from .core.reminders import collect_due as collect_due_items
from .core.search import SearchIndex
from .core.store import ExternalStatus, InventoryStore
from .core.userdata import StateData, UserData

_LOGGER = logging.getLogger(__name__)
T = TypeVar("T")

SIGNAL_UPDATED = f"{DOMAIN}_updated_{{}}"


class Snapshot:
    """Zahlen und Listen für Sensoren, einmal je Änderung berechnet."""

    def __init__(self, inv: Inventory) -> None:
        self.overview: Overview = build_overview(inv)
        due = collect_due_items(inv)
        self.due = [due_dict(inv, d) for d in due]
        by_cat: dict[str, list[dict[str, Any]]] = {c.value: [] for c in Category}
        for item in self.due:
            by_cat[item["category"]].append(item)
        self.by_category = by_cat
        self.checkouts = list_checkouts(inv)
        self.checkout_items = [
            {
                "name": c.node_name,
                "path": " › ".join(inv.tree.path_names(c.node_id)[:-1]),
                "detail": c.to,
                "due": c.until,
                "days": c.days_out,
                "overdue": c.overdue,
            }
            for c in self.checkouts
        ]
        from .core.model import UNSORTED_ID

        self.unsorted_items = [
            {"name": inv.data.nodes[i].name, "path": "Unsortiert", "detail": "", "due": None}
            for i in inv.tree.sorted_children(UNSORTED_ID)
        ]
        self.empty_items = [
            {
                "name": inv.data.nodes[i].name,
                "path": " › ".join(inv.tree.path_names(i)[:-1]),
                "detail": "",
                "due": None,
            }
            for i in self.overview.empty_containers
        ]

    def sensor(self, key: str) -> tuple[int, list[dict[str, Any]], dict[str, Any]]:
        """``(Anzahl, höchstens SENSOR_ITEM_LIMIT Einträge, weitere Attribute)`` für einen Sensor."""
        o = self.overview
        extra: dict[str, Any] = {}
        match key:
            case "items_total":
                return o.items, [], extra
            case "containers_total":
                return o.containers, [], extra
            case "empty_containers":
                return len(self.empty_items), self.empty_items, extra
            case "unsorted":
                return len(self.unsorted_items), self.unsorted_items, extra
            case "checked_out":
                extra["overdue"] = o.checked_out_overdue
                return len(self.checkout_items), self.checkout_items, extra
            case _:
                items = [
                    {k: v for k, v in i.items() if k in ("name", "path", "detail", "due", "days", "overdue")}
                    for i in self.by_category[key]
                ]
                return len(items), items, extra


class OrdnungsTrackerRuntime:
    """Alles, was zu einem eingerichteten Ordnungs-Tracker gehört."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self.directory = Path(hass.config.path(DATA_DIR_NAME))
        self.store = InventoryStore(self.directory)
        self.user_data = UserData(self.directory / "benutzer.json")
        self.state = StateData(self.directory / "zustand.json")
        self.index: SearchIndex | None = None
        self.snapshot: Snapshot | None = None
        self._subscribers: list[Callable[[dict[str, Any]], None]] = []
        self._unsubs: list[CALLBACK_TYPE] = []
        self._user_names: dict[str, str] = {}

    # -- Lebenslauf -----------------------------------------------------------------------
    @property
    def inventory(self) -> Inventory:
        return self.store.inventory

    @property
    def path_text(self) -> str:
        return str(self.directory / "inventar.json")

    async def async_start(self) -> None:
        """Laden (wirft bei ungültiger Datei, ohne etwas zu überschreiben) und Zeitgeber starten."""
        inv = await self.store.async_load()
        await self.user_data.async_load()
        await self.state.async_load()
        self.index = SearchIndex(inv)
        self.snapshot = Snapshot(inv)
        self._unsubs.append(self.store.add_change_listener(self._on_changes))
        self._unsubs.append(
            async_track_time_interval(
                self.hass, self._external_tick, timedelta(seconds=EXTERNAL_CHECK_SECONDS)
            )
        )
        self._unsubs.append(
            async_track_time_interval(self.hass, self._hourly_tick, timedelta(seconds=HOURLY_SECONDS))
        )
        await self.async_check_due(seed=not self.state.data.get("initialized"))

    async def async_stop(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        await self.store.async_stop()

    # -- Änderungen -----------------------------------------------------------------------
    def user_name(self, user_id: str | None) -> str:
        """Name des HA-Benutzers für das Protokoll (``system`` ohne Benutzer)."""
        if not user_id:
            return "system"
        if user_id not in self._user_names:
            # Der Benutzer kann inzwischen gelöscht sein; dann bleibt die Kennung im Protokoll.
            self._user_names[user_id] = user_id
        return self._user_names[user_id]

    async def async_resolve_user(self, user_id: str | None) -> str:
        if user_id and user_id not in self._user_names:
            user = await self.hass.auth.async_get_user(user_id)
            self._user_names[user_id] = user.name if user and user.name else user_id
        return self.user_name(user_id)

    async def async_mutate(self, func: Callable[[Inventory], T], user_id: str | None = None) -> T:
        """Eine Änderung ausführen (geprüft, protokolliert, gespeichert) und alle benachrichtigen."""
        name = await self.async_resolve_user(user_id)
        result = await self.store.async_mutate(func, name)
        self._refresh_save_issue()
        await self.async_check_due()
        return result

    @callback
    def _on_changes(self, changes: list[Change]) -> None:
        """Vom Speicher aufgerufen (auch bei Neuladen/Import/Wiederherstellen)."""
        inv = self.inventory
        self.snapshot = Snapshot(inv)
        reload = any(c.action in ("reload", "import", "restore", "rollback") for c in changes)
        touched: set[str] = set()
        for change in changes:
            if change.touched is None:
                reload = True
            else:
                touched.update(change.touched)
        payload = {
            "revision": inv.revision,
            "actions": [c.action for c in changes],
            "nodes": None if reload else sorted(touched),
            "reload": reload,
        }
        for subscriber in list(self._subscribers):
            subscriber(payload)
        async_dispatcher_send(self.hass, SIGNAL_UPDATED.format(self.entry.entry_id))
        if reload:
            self.hass.async_create_task(self._prune_user_data())

    async def _prune_user_data(self) -> None:
        await self.user_data.async_prune(set(self.inventory.data.nodes))

    def subscribe(self, callback_: Callable[[dict[str, Any]], None]) -> CALLBACK_TYPE:
        """Abo für Änderungen (WebSocket); liefert die Abmelde-Funktion."""
        self._subscribers.append(callback_)
        return lambda: self._subscribers.remove(callback_)

    # -- Fälligkeit und Ereignisse --------------------------------------------------------
    async def async_check_due(self, *, seed: bool = False) -> int:
        """Neu fällig gewordene Einträge einmalig als Ereignis melden (9.6).

        Beim allerersten Mal (``seed``) wird nur der Stand gemerkt, damit eine Neuinstallation nicht
        mit Meldungen über längst Fälliges beginnt. Der Merker überlebt Neustarts (``zustand.json``).
        """
        inv = self.inventory
        current = collect_due_items(inv)
        new, reported = new_due_items(current, self.state.reported)
        if not seed:
            for item in new:
                self.hass.bus.async_fire(EVENT_DUE, due_dict(inv, item))
            if any(item.category is Category.BELOW_MIN for item in new):
                self._auto_transfer_to_todo()
        if seed or reported != self.state.reported or not self.state.data.get("initialized"):
            self.state.data["initialized"] = True
            await self.state.async_set_reported(reported)
        return 0 if seed else len(new)

    def can_admin(self, is_admin: bool) -> bool:
        """Darf dieser Benutzer löschen und Einstellungen ändern? (Option „nur Administratoren“)"""
        return is_admin or not self.entry.options.get(CONF_ADMIN_ONLY)

    @callback
    def _auto_transfer_to_todo(self) -> None:
        """Nachkäufe selbsttätig auf die gewählte To-do-Liste setzen (Pflichtenheft 8.7, wahlweise)."""
        options = self.entry.options
        if not options.get(CONF_TODO_AUTO) or not options.get(CONF_TODO_ENTITY):
            return
        self.hass.async_create_task(self._async_auto_transfer())

    async def _async_auto_transfer(self) -> None:
        from .todo_transfer import async_transfer

        try:
            await async_transfer(self.hass, self, None)
        except HomeAssistantError as err:
            _LOGGER.warning("Automatische Übertragung auf die To-do-Liste fehlgeschlagen: %s", err)

    @callback
    def _hourly_tick(self, _now: Any) -> None:
        self.hass.async_create_task(self._hourly())

    async def _hourly(self) -> None:
        """Stündlich: Papierkorb aufräumen, Zahlen auffrischen (Datumswechsel), Fälliges melden."""
        await self.store.async_housekeeping()
        self.snapshot = Snapshot(self.inventory)
        async_dispatcher_send(self.hass, SIGNAL_UPDATED.format(self.entry.entry_id))
        await self.async_check_due()
        self._refresh_save_issue()

    # -- Änderungen von außen -------------------------------------------------------------
    @callback
    def _external_tick(self, _now: Any) -> None:
        self.hass.async_create_task(self.async_check_external())

    async def async_check_external(self) -> ExternalStatus:
        """Wurde ``inventar.json`` von Hand geändert? Neu laden oder Konfliktdatei anlegen (6.3)."""
        result = await self.store.async_check_external()
        if result.status is ExternalStatus.INVALID:
            repairs.report_external_invalid(self.hass, result.problems, result.conflict_file, self.path_text)
        else:
            repairs.clear(self.hass, ISSUE_EXTERNAL_INVALID)
        if result.status is ExternalStatus.CONFLICT and result.conflict_file:
            repairs.report_conflict(self.hass, result.conflict_file, self.path_text)
        elif result.status is ExternalStatus.RELOADED:
            repairs.clear(self.hass, ISSUE_CONFLICT)
        if result.status in (ExternalStatus.RELOADED, ExternalStatus.CONFLICT):
            await self.async_check_due()
        self._refresh_save_issue()
        return result.status

    @callback
    def _refresh_save_issue(self) -> None:
        if self.store.save_error is not None:
            repairs.report_save_failed(self.hass, str(self.store.save_error), self.path_text)
        else:
            repairs.clear(self.hass, ISSUE_SAVE_FAILED)

    # -- Hilfen für Entitäten -------------------------------------------------------------
    def events(self, start: Any, end: Any) -> list[Any]:
        return calendar_events(self.inventory, start, end)

    @property
    def item_limit(self) -> int:
        return SENSOR_ITEM_LIMIT
