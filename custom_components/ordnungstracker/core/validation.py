"""Prüfung der Regeln aus Pflichtenheft 5.14 (beim Laden und nach jeder Änderung).

1. Kein Knoten ist sein eigener Vorfahre.
2. Jeder ``parent``-Verweis zeigt auf einen vorhandenen Knoten.
3. Nummern sind eindeutig.
4. Jede Art, Person und Felddefinition, auf die verwiesen wird, existiert.
5. Verweise aus Listen und lokalen Felddefinitionen zeigen auf vorhandene Knoten.
6. Systemknoten bleiben erhalten.
"""

from __future__ import annotations

from typing import Any

from .errors import Problem
from .model import (
    TRASH_ID,
    UNSORTED_ID,
    FieldDef,
    FieldType,
    InventoryData,
    KindClass,
    Node,
    ScopeType,
)
from .parse import is_iso_date


def _p(code: str, message: str, node: Node | None = None, **data: Any) -> Problem:
    return Problem(code, message, node.id if node else None, node.name if node else None, data)


def field_value_error(definition: FieldDef, value: Any) -> str | None:
    """Passt ``value`` zum Typ der Felddefinition? Liefert einen Klartext-Fehler oder ``None``."""
    t = definition.type
    if t in (FieldType.TEXT, FieldType.MULTILINE, FieldType.LINK):
        return None if isinstance(value, str) else "muss Text sein"
    if t is FieldType.NUMBER:
        ok = isinstance(value, int | float) and not isinstance(value, bool)
        return None if ok else "muss eine Zahl sein"
    if t is FieldType.DATE:
        return None if is_iso_date(value) else "muss ein Datum der Form JJJJ-MM-TT sein"
    if t is FieldType.BOOL:
        return None if isinstance(value, bool) else "muss true oder false sein"
    if t is FieldType.CHOICE:
        return None if isinstance(value, str) else "muss ein Eintrag aus der Auswahlliste sein"
    return None  # pragma: no cover


def validate_inventory(data: InventoryData) -> list[Problem]:
    """Alle Regelverstöße des Inventars (leer = in Ordnung)."""
    problems: list[Problem] = []
    nodes = data.nodes

    # Systemknoten (Regel 6)
    for sid, label in ((UNSORTED_ID, "Unsortiert"), (TRASH_ID, "Papierkorb")):
        sysnode = nodes.get(sid)
        if sysnode is None:
            problems.append(
                _p(
                    "system_missing",
                    f'Der Systemknoten "{label}" (Kennung "{sid}") fehlt. Er muss immer vorhanden '
                    "sein; lege ihn wieder an oder stelle eine Sicherung wieder her.",
                )
            )
        elif sysnode.parent is not None:
            problems.append(
                _p(
                    "system_moved",
                    f'Der Systemknoten "{label}" muss auf oberster Ebene liegen.',
                    sysnode,
                )
            )

    if not any(k.kind_class is KindClass.GROUP for k in data.kinds.values()):
        problems.append(
            _p(
                "no_group_kind",
                'Es gibt keine Art der Klasse "group" (Gruppe). Sie wird gebraucht, damit ein Ding mit '
                'Unterpunkten zur Gruppe werden kann. Ergänze unter "kinds" eine Art mit "class": "group".',
            )
        )

    seen_numbers: dict[int, Node] = {}
    for node in nodes.values():
        # Regel 2: Eltern vorhanden
        if node.parent is not None and node.parent not in nodes:
            problems.append(
                _p(
                    "missing_parent",
                    f'Der Knoten "{node.name}" ({node.id}) liegt in "{node.parent}", das nicht '
                    'existiert. Setze "parent" auf einen vorhandenen Knoten oder entferne es.',
                    node,
                )
            )
        # Regel 4: Art, Besitzer, Felder
        if node.kind not in data.kinds:
            problems.append(
                _p(
                    "missing_kind",
                    f'Der Knoten "{node.name}" ({node.id}) hat die Art "{node.kind}", die nicht '
                    'in "kinds" definiert ist.',
                    node,
                )
            )
        if node.owner is not None and node.owner not in data.persons:
            problems.append(
                _p(
                    "missing_person",
                    f'Der Knoten "{node.name}" ({node.id}) hat den Besitzer "{node.owner}", der '
                    'nicht in "persons" steht.',
                    node,
                )
            )
        for fid, value in node.fields.items():
            definition = data.fields.get(fid)
            if definition is None:
                problems.append(
                    _p(
                        "missing_field",
                        f'Der Knoten "{node.name}" ({node.id}) hat einen Wert für das Feld "{fid}", '
                        'das nicht in "fields" definiert ist.',
                        node,
                    )
                )
                continue
            error = field_value_error(definition, value)
            if error:
                problems.append(
                    _p(
                        "field_value",
                        f'Der Knoten "{node.name}" ({node.id}): Der Wert des Feldes '
                        f'"{definition.name}" {error} (ist: {value!r}).',
                        node,
                    )
                )
        # Regel 3: Nummern
        if node.number is not None:
            other = seen_numbers.get(node.number)
            if other is not None:
                problems.append(
                    _p(
                        "duplicate_number",
                        f"Die Nummer {node.number} ist doppelt vergeben: bei "
                        f'"{other.name}" ({other.id}) und "{node.name}" ({node.id}). '
                        "Ändere eine der beiden Nummern.",
                        node,
                        number=node.number,
                    )
                )
            else:
                seen_numbers[node.number] = node
        task_ids: set[str] = set()
        for task in node.maintenance:
            if task.id in task_ids:
                problems.append(
                    _p(
                        "duplicate_task",
                        f'Der Knoten "{node.name}" ({node.id}) hat zwei Wartungsaufgaben mit der '
                        f'Kennung "{task.id}".',
                        node,
                    )
                )
            task_ids.add(task.id)
        if node.trashed is not None and node.parent != TRASH_ID:
            problems.append(
                _p(
                    "trash_info",
                    f'Der Knoten "{node.name}" ({node.id}) trägt einen Papierkorb-Vermerk, liegt '
                    "aber nicht direkt im Papierkorb.",
                    node,
                )
            )

    # Regel 1: Kreise (Parent-Ketten höchstens so lang wie die Zahl der Knoten)
    verified: set[str] = set()
    for start in nodes:
        chain: list[str] = []
        on_chain: set[str] = set()
        current: str | None = start
        while current is not None and current not in verified:
            if current in on_chain:
                loop = chain[chain.index(current) :]
                names = " → ".join(f'"{nodes[i].name}"' for i in loop)
                problems.append(
                    _p(
                        "cycle",
                        f"Die Verschachtelung bildet einen Kreis: {names}. Ein Knoten darf nicht "
                        "(auch nicht über mehrere Stufen) in sich selbst liegen.",
                        nodes[current],
                    )
                )
                break
            chain.append(current)
            on_chain.add(current)
            step = nodes.get(current)
            current = step.parent if step and step.parent in nodes else None
        verified.update(chain)

    # Felddefinitionen
    for definition in data.fields.values():
        for kid in definition.kinds:
            if kid not in data.kinds:
                problems.append(
                    _p(
                        "missing_kind",
                        f'Die Felddefinition "{definition.name}" ({definition.id}) beschränkt auf '
                        f'die Art "{kid}", die nicht existiert.',
                    )
                )
        if definition.scope.type is ScopeType.LOCAL:
            if definition.scope.node is None:
                problems.append(
                    _p(
                        "scope",
                        f'Die Felddefinition "{definition.name}" ({definition.id}) ist lokal, '
                        'nennt aber keinen Knoten ("scope": {"node": …}).',
                    )
                )
            elif definition.scope.node not in nodes:
                problems.append(
                    _p(
                        "missing_node",
                        f'Die Felddefinition "{definition.name}" ({definition.id}) gilt nur im '
                        f'Knoten "{definition.scope.node}", der nicht existiert.',
                    )
                )
        elif definition.scope.node is not None:
            problems.append(
                _p(
                    "scope",
                    f'Die Felddefinition "{definition.name}" ({definition.id}) ist global, nennt '
                    "aber einen Knoten.",
                )
            )
        if definition.type is FieldType.CHOICE and not definition.options:
            problems.append(
                _p(
                    "options",
                    f'Die Auswahl-Felddefinition "{definition.name}" ({definition.id}) hat keine Optionen.',
                )
            )
        if definition.remind_days_before is not None and definition.type is not FieldType.DATE:
            problems.append(
                _p(
                    "remind",
                    f'Die Felddefinition "{definition.name}" ({definition.id}) hat eine '
                    "Erinnerung, ist aber kein Datumsfeld.",
                )
            )

    # Vorlagen
    for tpl in data.templates.values():
        if tpl.kind not in data.kinds:
            problems.append(
                _p(
                    "missing_kind",
                    f'Die Vorlage "{tpl.name}" verwendet die unbekannte Art "{tpl.kind}".',
                )
            )
        if tpl.owner is not None and tpl.owner not in data.persons:
            problems.append(
                _p(
                    "missing_person",
                    f'Die Vorlage "{tpl.name}" nennt den unbekannten Besitzer "{tpl.owner}".',
                )
            )
        stack = list(tpl.children)
        while stack:
            child = stack.pop()
            if child.kind not in data.kinds:
                problems.append(
                    _p(
                        "missing_kind",
                        f'Die Vorlage "{tpl.name}": Unterpunkt "{child.name}" verwendet die '
                        f'unbekannte Art "{child.kind}".',
                    )
                )
            stack.extend(child.children)

    # Listen (Regel 5)
    for plist in data.lists.values():
        entry_ids: set[str] = set()
        for entry in plist.entries:
            if entry.id in entry_ids:
                problems.append(
                    _p(
                        "duplicate_entry",
                        f'Die Liste "{plist.name}" hat zwei Einträge "{entry.id}".',
                    )
                )
            entry_ids.add(entry.id)
            if entry.node is not None and entry.node not in nodes:
                problems.append(
                    _p(
                        "missing_node",
                        f'Die Liste "{plist.name}" verweist auf den Knoten "{entry.node}", der '
                        "nicht existiert.",
                    )
                )

    return problems


def unusual_placement(data: InventoryData, node: Node, parent: Node | None) -> str | None:
    """Hinweistext, wenn ``node`` in ``parent`` ungewöhnlich liegt (nie ein Fehler, 5.2)."""
    if parent is None:
        return None
    kind = data.kinds.get(node.kind)
    parent_kind = data.kinds.get(parent.kind)
    if kind is None or parent_kind is None:
        return None
    if kind.kind_class is KindClass.PLACE and parent_kind.kind_class is not KindClass.PLACE:
        return (
            f'Ungewöhnlich: "{node.name}" ({kind.name}) liegt in "{parent.name}" '
            f"({parent_kind.name}). Orte liegen sonst auf oberster Ebene oder in anderen Orten."
        )
    if kind.kind_class in (KindClass.FURNITURE, KindClass.CONTAINER) and parent_kind.kind_class in (
        KindClass.ITEM,
        KindClass.GROUP,
    ):
        return f'Ungewöhnlich: "{node.name}" ({kind.name}) liegt in "{parent.name}" ({parent_kind.name}).'
    return None
