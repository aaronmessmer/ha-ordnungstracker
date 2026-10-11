"""Geschützte Ansichten für Export und Druck (Pflichtenheft 8.10).

Die Seiten liegen **nicht** im öffentlichen ``www``-Ordner, sondern werden von einer angemeldeten
Ansicht geliefert. Die Oberfläche holt sich dafür über den WebSocket-Befehl
``ordnungstracker/print_url`` eine zeitlich begrenzte, signierte Adresse (siehe
docs/ENTSCHEIDUNGEN.md A3).
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from aiohttp import web
from homeassistant.components.http.auth import async_sign_path
from homeassistant.core import HomeAssistant
from homeassistant.helpers.http import KEY_HASS, HomeAssistantView

from .const import DOMAIN, SIGNED_URL_SECONDS, VIEW_URL
from .core import export
from .core.errors import InventoryError
from .runtime import OrdnungsTrackerRuntime

VIEWS = ("tree", "containers", "sheet", "packlist", "markdown", "json")
_REGISTERED = f"{DOMAIN}_views_registered"


def get_runtime(hass: HomeAssistant) -> OrdnungsTrackerRuntime | None:
    """Laufzeit des (einzigen) geladenen Eintrags."""
    for entry in hass.config_entries.async_loaded_entries(DOMAIN):
        return entry.runtime_data  # type: ignore[no-any-return]
    return None


def signed_url(hass: HomeAssistant, view: str, params: dict[str, str]) -> str:
    """Signierte Adresse einer Ansicht, ``SIGNED_URL_SECONDS`` gültig."""
    path = VIEW_URL.format(view=view)
    if params:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        path = f"{path}?{query}"
    return async_sign_path(hass, path, timedelta(seconds=SIGNED_URL_SECONDS))


def async_register_views(hass: HomeAssistant) -> None:
    if hass.data.get(_REGISTERED):
        return
    hass.http.register_view(PrintView())
    hass.data[_REGISTERED] = True


class PrintView(HomeAssistantView):
    """``GET /api/ordnungstracker/print/{view}`` – nur mit Anmeldung oder gültiger Signatur."""

    url = VIEW_URL
    name = "api:ordnungstracker:print"
    requires_auth = True

    async def get(self, request: web.Request, view: str) -> web.Response:
        hass = request.app[KEY_HASS]
        runtime = get_runtime(hass)
        if runtime is None:
            return web.Response(status=503, text="Der Ordnungs-Tracker ist nicht geladen.")
        if view not in VIEWS:
            return web.Response(status=404, text=f"Unbekannte Ansicht: {view}")
        node = request.query.get("node")
        list_id = request.query.get("list")
        inv = runtime.inventory
        try:
            if view == "json":
                text = await runtime.store.async_export_text()
                return self._file(text, "application/json", "inventar.json")
            if view == "markdown":
                return self._file(export.render_markdown(inv, node), "text/markdown", "inventar.md")
            if view == "tree":
                html = export.render_tree_html(inv, node)
            elif view == "containers":
                html = export.render_containers_html(inv)
            elif view == "sheet":
                if not node:
                    return web.Response(status=400, text="Für das Inhaltsblatt fehlt der Parameter node.")
                html = export.render_container_sheet_html(inv, node)
            else:
                if not list_id:
                    return web.Response(status=400, text="Für die Packliste fehlt der Parameter list.")
                html = export.render_packlist_html(inv, list_id)
        except InventoryError as err:
            return web.Response(status=404, text=err.message)
        return self._file(html, "text/html", None)

    @staticmethod
    def _file(text: str, content_type: str, filename: str | None) -> web.Response:
        headers: dict[str, Any] = {"Cache-Control": "no-store"}
        if filename:
            headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        return web.Response(text=text, content_type=content_type, charset="utf-8", headers=headers)
