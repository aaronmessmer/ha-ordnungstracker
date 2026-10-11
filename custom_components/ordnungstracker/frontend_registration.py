"""Auslieferung der Oberfläche: statischer Pfad, Karten-Ressource, Seitenleisten-Eintrag.

Siehe docs/ENTSCHEIDUNGEN.md A1/A2. Das gebaute Bündel (``frontend/ordnungstracker.js``) entsteht in
Phase 3; solange es fehlt, wird nichts angemeldet.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component

from .const import BUNDLE_NAME, DOMAIN, PANEL_ELEMENT, PANEL_URL_PATH, STATIC_URL

_LOGGER = logging.getLogger(__name__)
FRONTEND_DIR = Path(__file__).parent / "frontend"
_STATIC_KEY = f"{DOMAIN}_static_registered"


def bundle_path() -> Path:
    return FRONTEND_DIR / BUNDLE_NAME


def bundle_url(version: str) -> str:
    """Adresse des Bündels; die Version in der Adresse umgeht alte Zwischenspeicher."""
    return f"{STATIC_URL}/{BUNDLE_NAME}?v={version}"


async def async_register(hass: HomeAssistant, version: str, *, show_sidebar: bool) -> Callable[[], None]:
    """Bündel ausliefern und anmelden. Liefert eine Funktion, die alles wieder abmeldet."""
    undo: list[Callable[[], None]] = []
    if not await hass.async_add_executor_job(bundle_path().is_file):
        _LOGGER.debug("Noch kein Oberflächen-Bündel vorhanden (%s); nichts anzumelden", bundle_path())
        return lambda: None
    if not hass.data.get(_STATIC_KEY):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), cache_headers=False)]
        )
        hass.data[_STATIC_KEY] = True
    if "frontend" not in hass.config.components:
        _LOGGER.warning("Das Frontend ist nicht geladen; Karte und Seitenleiste werden nicht angemeldet")
        return lambda: None
    from homeassistant.components import frontend

    url = bundle_url(version)
    frontend.add_extra_js_url(hass, url)
    undo.append(lambda: frontend.remove_extra_js_url(hass, url))
    if show_sidebar and await async_setup_component(hass, "panel_custom", {}):
        from homeassistant.components import panel_custom

        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name=PANEL_ELEMENT,
            sidebar_title="Ordnung",
            sidebar_icon="mdi:package-variant",
            module_url=url,
            embed_iframe=False,
            require_admin=False,
        )
        undo.append(lambda: frontend.async_remove_panel(hass, PANEL_URL_PATH))

    def unregister() -> None:
        for fn in reversed(undo):
            fn()

    return unregister
