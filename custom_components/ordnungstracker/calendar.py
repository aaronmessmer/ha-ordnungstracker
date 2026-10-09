"""Kalender mit allen Terminen: Ablauf, Garantieende, Rückgabe, Wartung (Pflichtenheft 9.5)."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import OrdnungsTrackerConfigEntry
from .runtime import SIGNAL_UPDATED, OrdnungsTrackerRuntime
from .sensor import device_info

LOOKAHEAD_DAYS = 400


async def async_setup_entry(
    hass: HomeAssistant,
    entry: OrdnungsTrackerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([OrdnungsTrackerCalendar(entry.runtime_data)])


class OrdnungsTrackerCalendar(CalendarEntity):
    """Alle Termine des Inventars als ganztägige Ereignisse."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_translation_key = "dates"

    def __init__(self, runtime: OrdnungsTrackerRuntime) -> None:
        self._runtime = runtime
        self._attr_unique_id = f"{runtime.entry.entry_id}_calendar"
        self._attr_device_info = device_info(runtime.entry.entry_id)
        self._event: CalendarEvent | None = None
        self._refresh_next()

    @staticmethod
    def _to_event(day: date, title: str, description: str) -> CalendarEvent:
        return CalendarEvent(start=day, end=day + timedelta(days=1), summary=title, description=description)

    def _events_between(self, start: date, end: date) -> list[CalendarEvent]:
        inv = self._runtime.inventory
        result = []
        for ev in self._runtime.events(start, end):
            place = " › ".join(inv.tree.path_names(ev.node_id)[:-1])
            result.append(self._to_event(ev.day, ev.title, place))
        return result

    def _refresh_next(self) -> None:
        today = self._runtime.inventory.today()
        events = self._events_between(today, today + timedelta(days=LOOKAHEAD_DAYS))
        self._event = events[0] if events else None

    @property
    def event(self) -> CalendarEvent | None:
        """Der nächste Termin."""
        return self._event

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        """Termine im Zeitraum (Ende ausgeschlossen, wie von Home Assistant verlangt)."""
        return self._events_between(start_date.date(), (end_date - timedelta(microseconds=1)).date())

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(
            async_dispatcher_connect(
                self.hass, SIGNAL_UPDATED.format(self._runtime.entry.entry_id), self._handle_update
            )
        )

    @callback
    def _handle_update(self) -> None:
        self._refresh_next()
        self.async_write_ha_state()
