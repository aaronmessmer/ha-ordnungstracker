"""Berechtigungen: Löschen und Einstellungen wahlweise nur für Administratoren (Pflichtenheft 8.13)."""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.core import Context, HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ordnungstracker.const import CONF_ADMIN_ONLY, DOMAIN
from custom_components.ordnungstracker.permissions import ADMIN_COMMANDS
from custom_components.ordnungstracker.websocket_api import READ, WRITE

from .helpers import fail, ok


@pytest.fixture
async def member(hass: HomeAssistant, init_integration: MockConfigEntry, hass_ws_client: Any) -> Any:
    """Verbindung eines Benutzers ohne Administratorrechte."""
    user = await hass.auth.async_create_user("Kind", group_ids=["system-users"])
    refresh = await hass.auth.async_create_refresh_token(user, "https://example.test/")
    token = hass.auth.async_create_access_token(refresh)
    client = await hass_ws_client(hass, token)
    yield client
    await client.close()


async def _restrict(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    hass.config_entries.async_update_entry(entry, options={CONF_ADMIN_ONLY: True})
    await hass.async_block_till_done()


def test_admin_commands_exist() -> None:
    assert set(READ) | set(WRITE) >= ADMIN_COMMANDS


async def test_everyone_may_do_everything_by_default(member: Any) -> None:
    assert (await ok(member, "status"))["can_admin"] is True
    node = (await ok(member, "create", name="Keller"))["id"]
    await ok(member, "delete", node_id=node)
    await ok(member, "settings", settings={"lent_days": 40})


async def test_restriction_blocks_deleting_and_settings_for_members(
    hass: HomeAssistant, init_integration: MockConfigEntry, member: Any, hass_ws_client: Any
) -> None:
    admin = await hass_ws_client(hass)
    node = (await ok(admin, "create", name="Keller"))["id"]
    await _restrict(hass, init_integration)

    assert (await ok(member, "status"))["can_admin"] is False
    assert (await ok(admin, "status"))["can_admin"] is True
    for command, fields in [
        ("delete", {"node_id": node}),
        ("settings", {"settings": {"lent_days": 40}}),
        ("synonyms", {"groups": [["a", "b"]]}),
        ("kind_add", {"name": "Schublade", "class": "container"}),
        ("trash_empty", {}),
        ("sample_load", {}),
    ]:
        error = await fail(member, command, **fields)
        assert error["code"] == "unauthorized" and "Administrator" in error["message"], command

    # everything else stays open for members
    await ok(member, "create", name="Regal", parent=node)
    # administrators are not restricted
    await ok(admin, "delete", node_id=node)
    await admin.close()


async def test_services_follow_the_restriction(
    hass: HomeAssistant, init_integration: MockConfigEntry, hass_admin_user: Any
) -> None:
    runtime = init_integration.runtime_data
    node = await runtime.async_mutate(lambda inv: inv.create_node("Keller", "raum", None).id)
    await _restrict(hass, init_integration)
    member = await hass.auth.async_create_user("Kind", group_ids=["system-users"])

    async def delete(user_id: str | None) -> Any:
        return await hass.services.async_call(
            DOMAIN, "delete_node", {"node": node}, blocking=True, return_response=True,
            context=Context(user_id=user_id),
        )  # fmt: skip

    with pytest.raises(ServiceValidationError, match="Administrator"):
        await delete(member.id)
    assert (await delete(hass_admin_user.id))["id"] == node
