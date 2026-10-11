"""Dienste für Automationen und Skripte (Pflichtenheft 9.4).

Alle Dienste, die etwas ändern, laufen über dieselben Operationen wie die Oberfläche und vermerken
den aufrufenden Benutzer im Änderungsprotokoll. Wo es sich anbietet, liefern sie Antwortdaten.
Einen Eintrag nennt man mit seiner Kennung **oder seiner Nummer** (``14`` oder ``#14``).
"""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv

from . import todo_transfer
from .const import DOMAIN
from .core import export, present
from .core.errors import InventoryError
from .core.inventory import Inventory
from .core.model import CheckoutType, Condition
from .core.sample import load_sample, remove_sample
from .core.search import SearchFilter
from .permissions import async_service_allowed
from .runtime import OrdnungsTrackerRuntime
from .views import get_runtime

_NUMBER = re.compile(r"^\s*#?\s*(\d+)\s*$")
_REGISTERED = f"{DOMAIN}_services_registered"

NODE = vol.Required("node")
NODE_REF = vol.All(vol.Coerce(str), vol.Length(min=1))
_NUM = vol.Any(vol.Coerce(float), None)
_CHANGEABLE = {
    vol.Optional("name"): cv.string,
    vol.Optional("kind"): cv.string,
    vol.Optional("number"): vol.Any(None, vol.All(vol.Coerce(int), vol.Range(min=1))),
    vol.Optional("aliases"): [cv.string],
    vol.Optional("tags"): [cv.string],
    vol.Optional("note"): cv.string,
    vol.Optional("owner"): vol.Any(None, cv.string),
    vol.Optional("quantity"): _NUM,
    vol.Optional("unit"): cv.string,
    vol.Optional("min_quantity"): _NUM,
    vol.Optional("condition"): vol.In([c.value for c in Condition]),
}


def _runtime(hass: HomeAssistant) -> OrdnungsTrackerRuntime:
    runtime = get_runtime(hass)
    if runtime is None:
        raise ServiceValidationError(
            "Der Ordnungs-Tracker ist nicht geladen. Prüfe unter Einstellungen → Reparaturen, ob die "
            "Datei inventar.json beanstandet wird.",
            translation_domain=DOMAIN,
            translation_key="not_loaded",
        )
    return runtime


def resolve(inv: Inventory, ref: str | None) -> str:
    """Kennung zu einer Angabe: Nummer (``14``, ``#14``) oder Kennung."""
    if ref is None:
        raise ServiceValidationError("Es fehlt die Angabe des Eintrags.")
    match = _NUMBER.match(str(ref))
    if match:
        holder = inv.find_by_number(int(match.group(1)))
        if holder is not None:
            return holder.id
    inv.node(str(ref))  # wirft NotFoundError mit deutscher Meldung
    return str(ref)


async def _admin_check(call: ServiceCall) -> None:
    """Löschen und Beispieldaten nur für Administratoren, wenn die Option es verlangt."""
    runtime = _runtime(call.hass)
    await async_service_allowed(call.hass, runtime.entry.options, call.context.user_id)


async def _run(call: ServiceCall, fn: Any) -> Any:
    """Änderung über die Laufzeit ausführen; Fehler des Kerns werden zu Dienstfehlern."""
    runtime = _runtime(call.hass)
    try:
        return await runtime.async_mutate(fn, call.context.user_id)
    except InventoryError as err:
        raise ServiceValidationError(err.message) from err


def async_register_services(hass: HomeAssistant) -> None:
    """Dienste anmelden (einmal je Home Assistant; sie erkennen selbst, ob der Eintrag geladen ist)."""
    if hass.data.get(_REGISTERED):
        return
    hass.data[_REGISTERED] = True

    async def search(call: ServiceCall) -> ServiceResponse:
        runtime = _runtime(call.hass)
        assert runtime.index is not None
        inv = runtime.inventory
        data = call.data
        try:
            flt = SearchFilter(
                kinds=frozenset({data["kind"]}) if "kind" in data else None,
                within=resolve(inv, data["within"]) if "within" in data else None,
                owner=data.get("owner"),
                tag=data.get("tag"),
                condition=Condition(data["condition"]) if "condition" in data else None,
                checked_out=data.get("checked_out"),
                include_archived=data.get("include_archived", False),
            )
            result = runtime.index.search(data.get("query", ""), flt, data["limit"])
        except InventoryError as err:
            raise ServiceValidationError(err.message) from err
        return {
            "total": result.total,
            "results": [present.hit_dict(h) for h in result.hits],
        }

    async def get_node(call: ServiceCall) -> ServiceResponse:
        inv = _runtime(call.hass).inventory
        try:
            return present.node_detail(inv, resolve(inv, call.data["node"]))
        except InventoryError as err:
            raise ServiceValidationError(err.message) from err

    async def create_node(call: ServiceCall) -> ServiceResponse:
        data = dict(call.data)

        def op(inv: Inventory) -> dict[str, Any]:
            parent = resolve(inv, data["parent"]) if data.get("parent") else None
            kind = data.get("kind") or inv.tree.suggest_kind(parent)
            node = inv.create_node(
                data["name"],
                kind,
                parent,
                number=data.get("number"),
                aliases=data.get("aliases", []),
                tags=data.get("tags", []),
                note=data.get("note", ""),
                owner=data.get("owner"),
                quantity=data.get("quantity"),
                unit=data.get("unit", ""),
                min_quantity=data.get("min_quantity"),
            )
            return {"id": node.id, "number": node.number}

        return await _run(call, op)  # type: ignore[no-any-return]

    async def update_node(call: ServiceCall) -> ServiceResponse:
        changes = {k: v for k, v in call.data.items() if k != "node"}

        def op(inv: Inventory) -> dict[str, Any]:
            node_id = resolve(inv, call.data["node"])
            inv.update_node(node_id, changes)
            return {"id": node_id}

        return await _run(call, op)  # type: ignore[no-any-return]

    async def move_node(call: ServiceCall) -> ServiceResponse:
        def op(inv: Inventory) -> dict[str, Any]:
            ids = [resolve(inv, ref) for ref in call.data["nodes"]]
            target = resolve(inv, call.data["target"])
            return {"moved": [n.id for n in inv.move_nodes(ids, target)]}

        return await _run(call, op)  # type: ignore[no-any-return]

    async def delete_node(call: ServiceCall) -> ServiceResponse:
        await _admin_check(call)

        def op(inv: Inventory) -> dict[str, Any]:
            node_id = resolve(inv, call.data["node"])
            affected = inv.tree.content_counts(node_id)[1]
            inv.delete_node(node_id, call.data["mode"])
            return {"id": node_id, "descendants": affected}

        return await _run(call, op)  # type: ignore[no-any-return]

    async def check_out(call: ServiceCall) -> ServiceResponse:
        data = call.data

        def op(inv: Inventory) -> dict[str, Any]:
            node_id = resolve(inv, data["node"])
            inv.checkout_node(
                node_id,
                CheckoutType(data["type"]),
                data["to"],
                since=data.get("since"),
                until=data.get("until"),
                note=data.get("note", ""),
                no_reminder=data.get("no_reminder", False),
            )
            return {"id": node_id}

        return await _run(call, op)  # type: ignore[no-any-return]

    async def return_node(call: ServiceCall) -> ServiceResponse:
        def op(inv: Inventory) -> dict[str, Any]:
            node_id = resolve(inv, call.data["node"])
            inv.return_node(node_id)
            return {"id": node_id}

        return await _run(call, op)  # type: ignore[no-any-return]

    async def adjust_quantity(call: ServiceCall) -> ServiceResponse:
        def op(inv: Inventory) -> dict[str, Any]:
            node_id = resolve(inv, call.data["node"])
            if "delta" in call.data:
                node = inv.adjust_quantity(node_id, call.data["delta"])
            elif "quantity" in call.data:
                node = inv.set_quantity(node_id, call.data["quantity"])
            else:
                raise ServiceValidationError("Gib entweder delta (Änderung) oder quantity (neue Menge) an.")
            return {"id": node_id, "quantity": node.quantity}

        return await _run(call, op)  # type: ignore[no-any-return]

    async def transfer_to_todo(call: ServiceCall) -> ServiceResponse:
        runtime = _runtime(call.hass)
        return await todo_transfer.async_transfer(call.hass, runtime, call.data.get("todo_entity"))

    async def reload(call: ServiceCall) -> ServiceResponse:
        """Datei neu einlesen (nach Bearbeiten von Hand)."""
        runtime = _runtime(call.hass)
        status = await runtime.async_check_external()
        return {"status": status.value}

    async def create_backup(call: ServiceCall) -> ServiceResponse:
        runtime = _runtime(call.hass)
        return {"name": await runtime.store.async_backup("manuell")}

    async def export_data(call: ServiceCall) -> ServiceResponse:
        runtime = _runtime(call.hass)
        try:
            if call.data["format"] == "json":
                return {"filename": "inventar.json", "text": await runtime.store.async_export_text()}
            node = resolve(runtime.inventory, call.data["node"]) if call.data.get("node") else None
            return {"filename": "inventar.md", "text": export.render_markdown(runtime.inventory, node)}
        except InventoryError as err:
            raise ServiceValidationError(err.message) from err

    async def load_sample_service(call: ServiceCall) -> ServiceResponse:
        """Beispielhaushalt laden (nur in ein leeres Inventar)."""
        await _admin_check(call)
        return await _run(call, lambda inv: {"created": load_sample(inv)})  # type: ignore[no-any-return]

    async def remove_sample_service(call: ServiceCall) -> ServiceResponse:
        """Beispieldaten wieder entfernen; eigene Einträge darin wandern nach „Unsortiert“."""
        await _admin_check(call)
        return await _run(call, lambda inv: {"removed": remove_sample(inv)})  # type: ignore[no-any-return]

    only, optional = SupportsResponse.ONLY, SupportsResponse.OPTIONAL
    entries: list[tuple[str, Any, vol.Schema, SupportsResponse]] = [
        (
            "search",
            search,
            vol.Schema(
                {
                    vol.Optional("query", default=""): cv.string,
                    vol.Optional("kind"): cv.string,
                    vol.Optional("within"): NODE_REF,
                    vol.Optional("owner"): cv.string,
                    vol.Optional("tag"): cv.string,
                    vol.Optional("condition"): vol.In([c.value for c in Condition]),
                    vol.Optional("checked_out"): cv.boolean,
                    vol.Optional("include_archived"): cv.boolean,
                    vol.Optional("limit", default=20): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
                }
            ),
            only,
        ),
        ("get_node", get_node, vol.Schema({NODE: NODE_REF}), only),
        (
            "create_node",
            create_node,
            vol.Schema(
                {
                    vol.Required("name"): cv.string,
                    vol.Optional("parent"): NODE_REF,
                    vol.Optional("number"): vol.Any("auto", vol.All(vol.Coerce(int), vol.Range(min=1))),
                    **{
                        k: v
                        for k, v in _CHANGEABLE.items()
                        if k.schema not in ("name", "number", "condition")
                    },
                }
            ),
            optional,
        ),
        ("update_node", update_node, vol.Schema({NODE: NODE_REF, **_CHANGEABLE}), optional),
        (
            "move_node",
            move_node,
            vol.Schema(
                {vol.Required("nodes"): vol.All(cv.ensure_list, [NODE_REF]), vol.Required("target"): NODE_REF}
            ),
            optional,
        ),
        (
            "delete_node",
            delete_node,
            vol.Schema({NODE: NODE_REF, vol.Optional("mode", default="trash"): vol.In(["trash", "lift"])}),
            optional,
        ),
        (
            "check_out",
            check_out,
            vol.Schema(
                {
                    NODE: NODE_REF,
                    vol.Required("type"): vol.In([t.value for t in CheckoutType]),
                    vol.Required("to"): cv.string,
                    vol.Optional("since"): cv.string,
                    vol.Optional("until"): cv.string,
                    vol.Optional("note"): cv.string,
                    vol.Optional("no_reminder"): cv.boolean,
                }
            ),
            optional,
        ),
        ("return_node", return_node, vol.Schema({NODE: NODE_REF}), optional),
        (
            "adjust_quantity",
            adjust_quantity,
            vol.Schema(
                {
                    NODE: NODE_REF,
                    vol.Exclusive("delta", "q"): vol.Coerce(float),
                    vol.Exclusive("quantity", "q"): _NUM,
                }
            ),
            optional,
        ),
        (
            "transfer_to_todo",
            transfer_to_todo,
            vol.Schema({vol.Optional("todo_entity"): cv.entity_id}),
            optional,
        ),
        ("load_sample", load_sample_service, vol.Schema({}), optional),
        ("remove_sample", remove_sample_service, vol.Schema({}), optional),
        ("reload", reload, vol.Schema({}), optional),
        ("create_backup", create_backup, vol.Schema({}), optional),
        (
            "export",
            export_data,
            vol.Schema(
                {vol.Required("format"): vol.In(["json", "markdown"]), vol.Optional("node"): NODE_REF}
            ),
            only,
        ),
    ]
    for name, handler, schema, response in entries:
        hass.services.async_register(DOMAIN, name, handler, schema=schema, supports_response=response)
