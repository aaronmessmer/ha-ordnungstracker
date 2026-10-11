"""Testkonfiguration der Home-Assistant-Schicht."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ordnungstracker.const import DOMAIN, NAME


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Eigene Integrationen in der Testinstanz von Home Assistant zulassen."""


@pytest.fixture(autouse=True)
def config_dir(hass: HomeAssistant, tmp_path: Path) -> Path:
    """Daten des Ordnungs-Trackers liegen in einem Wegwerf-Ordner, nie im Paket."""
    hass.config.config_dir = str(tmp_path)
    return tmp_path


@pytest.fixture
def data_dir(config_dir: Path) -> Path:
    return config_dir / "ordnungstracker"


@pytest.fixture
async def init_integration(hass: HomeAssistant) -> AsyncGenerator[MockConfigEntry]:
    """Eingerichtete Integration mit leerem Inventar; wird am Ende sauber entladen."""
    entry = MockConfigEntry(domain=DOMAIN, title=NAME, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    yield entry
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
