"""Geschützte Export-/Druckansichten und Auslieferung der Oberfläche (Pflichtenheft 8.10, 9.2)."""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ordnungstracker import frontend_registration
from custom_components.ordnungstracker.const import DOMAIN
from custom_components.ordnungstracker.core.sample import load_sample

from .helpers import ok


@pytest.fixture
async def sample(hass: HomeAssistant, init_integration: MockConfigEntry) -> MockConfigEntry:
    await init_integration.runtime_data.async_mutate(load_sample)
    return init_integration


async def test_views_require_login(
    hass: HomeAssistant, sample: MockConfigEntry, hass_client_no_auth: Any
) -> None:
    client = await hass_client_no_auth()
    for view in ("tree", "containers", "json", "markdown"):
        resp = await client.get(f"/api/ordnungstracker/print/{view}")
        assert resp.status == 401, view


async def test_authenticated_views(hass: HomeAssistant, sample: MockConfigEntry, hass_client: Any) -> None:
    client = await hass_client()
    tree = await client.get("/api/ordnungstracker/print/tree")
    assert tree.status == 200 and tree.content_type == "text/html"
    html = await tree.text()
    assert "Heißklebepistole" in html and "@media print" in html
    assert tree.headers["Cache-Control"] == "no-store"
    containers = await (await client.get("/api/ordnungstracker/print/containers")).text()
    assert "Erste-Hilfe-Tasche" in containers
    node = sample.runtime_data.inventory.find_by_number(14)
    assert node is not None
    sheet = await (await client.get(f"/api/ordnungstracker/print/sheet?node={node.id}")).text()
    assert '<p class="big">14</p>' in sheet
    liste = next(iter(sample.runtime_data.inventory.data.lists))
    pack = await (await client.get(f"/api/ordnungstracker/print/packlist?list={liste}")).text()
    assert "Wasserkanister füllen" in pack
    md = await client.get("/api/ordnungstracker/print/markdown")
    assert md.content_type == "text/markdown" and (await md.text()).startswith("# Inventar")
    js = await client.get("/api/ordnungstracker/print/json")
    assert js.headers["Content-Disposition"] == 'attachment; filename="inventar.json"'
    assert (await js.json())["schema_version"] == 1


async def test_view_errors(hass: HomeAssistant, sample: MockConfigEntry, hass_client: Any) -> None:
    client = await hass_client()
    assert (await client.get("/api/ordnungstracker/print/unbekannt")).status == 404
    assert (await client.get("/api/ordnungstracker/print/sheet")).status == 400
    assert (await client.get("/api/ordnungstracker/print/packlist")).status == 400
    assert (await client.get("/api/ordnungstracker/print/sheet?node=nix")).status == 404
    assert (await client.get("/api/ordnungstracker/print/markdown?node=nix")).status == 404


async def test_signed_url_works_without_login_and_not_for_other_paths(
    hass: HomeAssistant, sample: MockConfigEntry, hass_ws_client: Any, hass_client_no_auth: Any
) -> None:
    ws_client = await hass_ws_client(hass)
    node = sample.runtime_data.inventory.find_by_number(14)
    assert node is not None
    result = await ok(ws_client, "print_url", view="sheet", node=node.id)
    assert result["expires_in"] == 300 and "authSig=" in result["url"]
    anonymous = await hass_client_no_auth()
    resp = await anonymous.get(result["url"])
    assert resp.status == 200 and '<p class="big">14</p>' in await resp.text()
    other = await anonymous.get(result["url"].replace("sheet", "tree"))
    assert other.status == 401  # Signatur gilt nur für genau diese Adresse
    await ws_client.close()


async def test_signed_url_expires(
    hass: HomeAssistant, sample: MockConfigEntry, hass_ws_client: Any, hass_client_no_auth: Any, freezer: Any
) -> None:
    from datetime import timedelta

    ws_client = await hass_ws_client(hass)
    url = (await ok(ws_client, "print_url", view="containers"))["url"]
    anonymous = await hass_client_no_auth()
    assert (await anonymous.get(url)).status == 200
    freezer.tick(timedelta(minutes=6))
    assert (await anonymous.get(url)).status == 401
    await ws_client.close()


async def test_view_without_loaded_entry(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_client: Any
) -> None:
    client = await hass_client()
    await hass.config_entries.async_unload(init_integration.entry_id)
    assert (await client.get("/api/ordnungstracker/print/tree")).status == 503


# -- Auslieferung der Oberfläche ----------------------------------------------------------
async def test_nothing_is_registered_without_bundle(hass: HomeAssistant, tmp_path: Path) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="Ordnungs-Tracker", data={})
    entry.add_to_hass(hass)
    with patch.object(frontend_registration, "FRONTEND_DIR", tmp_path):  # empty folder: no bundle
        assert not frontend_registration.bundle_path().exists()
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        assert hass.data.get("frontend_panels", {}).get("ordnungstracker") is None
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()


async def test_bundle_is_registered_when_present(hass: HomeAssistant, tmp_path: Path) -> None:
    (tmp_path / "ordnungstracker.js").write_text("export {};", encoding="utf-8")
    hass.config.components.add("frontend")
    add_url = patch("homeassistant.components.frontend.add_extra_js_url")
    remove_url = patch("homeassistant.components.frontend.remove_extra_js_url")
    panel = patch("homeassistant.components.panel_custom.async_register_panel", new=AsyncMock())
    remove_panel = patch("homeassistant.components.frontend.async_remove_panel")
    with (
        patch.object(frontend_registration, "FRONTEND_DIR", tmp_path),
        patch.object(frontend_registration, "async_setup_component", new=AsyncMock(return_value=True)),
        add_url as add_mock,
        remove_url as remove_mock,
        panel as panel_mock,
        remove_panel as remove_panel_mock,
    ):
        from homeassistant.setup import async_setup_component

        assert await async_setup_component(hass, "http", {})
        undo = await frontend_registration.async_register(hass, "1.2.3", show_sidebar=True)
        add_mock.assert_called_once_with(hass, "/ordnungstracker_static/ordnungstracker.js?v=1.2.3")
        kwargs = panel_mock.call_args.kwargs
        assert kwargs["frontend_url_path"] == "ordnungstracker" and kwargs["sidebar_title"] == "Ordnung"
        assert kwargs["require_admin"] is False and kwargs["module_url"].endswith("?v=1.2.3")
        undo()
        remove_mock.assert_called_once()
        remove_panel_mock.assert_called_once_with(hass, "ordnungstracker")


async def test_sidebar_can_be_switched_off(hass: HomeAssistant, tmp_path: Path) -> None:
    (tmp_path / "ordnungstracker.js").write_text("export {};", encoding="utf-8")
    hass.config.components.add("frontend")
    from homeassistant.setup import async_setup_component

    assert await async_setup_component(hass, "http", {})
    with (
        patch.object(frontend_registration, "FRONTEND_DIR", tmp_path),
        patch("homeassistant.components.frontend.add_extra_js_url") as add_mock,
        patch("homeassistant.components.panel_custom.async_register_panel", new=AsyncMock()) as panel_mock,
    ):
        await frontend_registration.async_register(hass, "1", show_sidebar=False)
        add_mock.assert_called_once()
        panel_mock.assert_not_called()


async def test_static_path_is_registered_once(hass: HomeAssistant, tmp_path: Path) -> None:
    (tmp_path / "ordnungstracker.js").write_text("export {};", encoding="utf-8")
    from homeassistant.setup import async_setup_component

    assert await async_setup_component(hass, "http", {})
    with patch.object(frontend_registration, "FRONTEND_DIR", tmp_path):
        await frontend_registration.async_register(
            hass, "1", show_sidebar=True
        )  # kein Frontend: nur statisch
        await frontend_registration.async_register(hass, "1", show_sidebar=True)
    assert hass.data[f"{DOMAIN}_static_registered"] is True
