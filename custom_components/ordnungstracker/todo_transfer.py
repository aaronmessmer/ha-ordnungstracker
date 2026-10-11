"""Nachkäufe (unter Mindestbestand) in eine To-do-Liste von Home Assistant übertragen (8.7, 9.4).

Doppelte werden vermieden: Was schon offen auf der Liste steht, wird nicht noch einmal eingetragen.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from .core.reminders import Category, collect_due
from .runtime import OrdnungsTrackerRuntime


def _summary(name: str) -> str:
    return name.strip()


async def async_transfer(
    hass: HomeAssistant, runtime: OrdnungsTrackerRuntime, entity_id: str | None
) -> dict[str, Any]:
    """Alles unter Mindestbestand auf die Liste setzen. Liefert ``added``, ``skipped``, ``entity_id``."""
    from .const import CONF_TODO_ENTITY

    entity_id = entity_id or runtime.entry.options.get(CONF_TODO_ENTITY)
    if not entity_id:
        raise ServiceValidationError(
            "Es ist keine To-do-Liste gewählt. Wähle sie in den Optionen der Integration oder gib "
            "todo_entity an.",
            translation_domain="ordnungstracker",
            translation_key="no_todo_entity",
        )
    if hass.states.get(entity_id) is None:
        raise ServiceValidationError(
            f"Die To-do-Liste {entity_id} gibt es nicht.",
            translation_domain="ordnungstracker",
            translation_key="todo_unknown",
            translation_placeholders={"entity_id": entity_id},
        )
    response = await hass.services.async_call(
        "todo",
        "get_items",
        {"entity_id": entity_id, "status": ["needs_action"]},
        blocking=True,
        return_response=True,
    )
    existing = {
        _summary(item["summary"]).casefold() for item in (response or {}).get(entity_id, {}).get("items", [])
    }
    inv = runtime.inventory
    added: list[str] = []
    skipped: list[str] = []
    for item in collect_due(inv):
        if item.category is not Category.BELOW_MIN:
            continue
        node = inv.data.nodes[item.node_id]
        summary = _summary(node.name)
        if summary.casefold() in existing:
            skipped.append(summary)
            continue
        place = " › ".join(inv.tree.path_names(node.id)[:-1])
        have = f"{node.quantity:g}" if node.quantity is not None else "?"
        want = f"{node.min_quantity:g}" if node.min_quantity is not None else "?"
        await hass.services.async_call(
            "todo",
            "add_item",
            {
                "entity_id": entity_id,
                "item": summary,
                "description": f"Bestand {have} {node.unit}, Mindestbestand {want} – {place}".replace(
                    "  ", " "
                ),
            },
            blocking=True,
        )
        existing.add(summary.casefold())
        added.append(summary)
    return {"entity_id": entity_id, "added": added, "skipped": skipped}
