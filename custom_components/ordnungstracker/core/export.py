"""Lesbare Exporte: Markdown und HTML-Druckansichten (Pflichtenheft 8.10).

Die Druckseiten sind eigenständige HTML-Seiten (ohne externe Dateien), die der Browser druckt.
Die geschützte Auslieferung übernimmt die Home-Assistant-Schicht (Phase 2).
"""

from __future__ import annotations

from html import escape
from typing import TYPE_CHECKING

from .model import SYSTEM_IDS, TRASH_ID, UNSORTED_ID, KindClass

if TYPE_CHECKING:
    from .inventory import Inventory

_CSS = """
:root{color-scheme:light}
body{font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;margin:24px;color:#111}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:18px 0 6px}
.sub{color:#555;margin:0 0 16px}
ul{margin:2px 0 2px 0;padding-left:20px}li{margin:1px 0}
.num{display:inline-block;min-width:2.2em;font-weight:700}
.meta{color:#555}
table{border-collapse:collapse;width:100%}
th,td{border-bottom:1px solid #bbb;padding:4px 8px;text-align:left;vertical-align:top}
th{border-bottom:2px solid #000}
.big{font-size:120px;line-height:1;font-weight:800;margin:0}.bigname{font-size:36px;margin:0 0 6px}
.box{display:inline-block;width:1em;height:1em;border:1.5px solid #000;margin-right:.5em;vertical-align:-2px}
.box.on{background:#000}
@page{size:A4;margin:14mm}
@media print{body{margin:0}.noprint{display:none}}
"""


def _page(title: str, body: str) -> str:
    return (
        '<!doctype html>\n<html lang="de"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f"<title>{escape(title)}</title><style>{_CSS}</style></head><body>{body}</body></html>\n"
    )


def _qty(node_qty: float | None, unit: str) -> str:
    if node_qty is None:
        return ""
    return f"{node_qty:g} {unit}".strip() if unit else f"{node_qty:g}×"


def _kind_label(inv: Inventory, node_id: str) -> str:
    node = inv.data.nodes[node_id]
    kind = inv.data.kinds[node.kind]
    return f"{kind.name} {node.number}" if node.number is not None else kind.name


def _visible_children(inv: Inventory, node_id: str | None) -> list[str]:
    tree = inv.tree
    return [c for c in tree.sorted_children(node_id) if c != TRASH_ID]


def _extras(inv: Inventory, node_id: str) -> list[str]:
    node = inv.data.nodes[node_id]
    parts: list[str] = []
    if q := _qty(node.quantity, node.unit):
        parts.append(q)
    if node.checkout is not None:
        verb = "ausgeliehen an" if node.checkout.type.value == "lent" else "entnommen:"
        parts.append(f"{verb} {node.checkout.to}")
    if node.condition.value not in ("ok",):
        labels = {
            "missing": "vermisst",
            "defective": "defekt",
            "to_sell": "zu verkaufen",
            "to_give_away": "zu verschenken",
            "disposed": "entsorgt",
        }
        parts.append(labels[node.condition.value])
    return parts


def render_markdown(
    inv: Inventory, root_id: str | None = None, *, include_empty_unsorted: bool = False
) -> str:
    """Ganzes Inventar oder ein Teilbaum als verschachtelte Markdown-Liste."""
    lines: list[str] = []

    def label(node_id: str) -> str:
        node = inv.data.nodes[node_id]
        kind = inv.data.kinds[node.kind]
        is_structure = kind.kind_class is not KindClass.ITEM and kind.kind_class is not KindClass.GROUP
        text = f"**{node.name}**" if is_structure else node.name
        if node.number is not None:
            text += f" ({_kind_label(inv, node_id)})"
        extras = _extras(inv, node_id)
        if extras:
            text += " – " + ", ".join(extras)
        return text

    def walk(node_id: str, depth: int) -> None:
        lines.append("  " * depth + f"- {label(node_id)}")
        note = inv.data.nodes[node_id].note.strip()
        if note:
            lines.append("  " * (depth + 1) + f"- _{note.splitlines()[0]}_")
        for child in _visible_children(inv, node_id):
            walk(child, depth + 1)

    if root_id is not None:
        inv.node(root_id)
        title = inv.data.nodes[root_id].name
        walk(root_id, 0)
    else:
        title = "Inventar"
        for top in _visible_children(inv, None):
            if top == UNSORTED_ID and not inv.tree.children_ids(UNSORTED_ID) and not include_empty_unsorted:
                continue
            walk(top, 0)
    return f"# {title}\n\n" + "\n".join(lines) + "\n"


def _html_tree(inv: Inventory, node_id: str, *, with_root: bool) -> str:
    def li(nid: str) -> str:
        node = inv.data.nodes[nid]
        head = ""
        if node.number is not None:
            head = f'<span class="num">{node.number}</span> '
        extras = _extras(inv, nid)
        meta = f' <span class="meta">– {escape(", ".join(extras))}</span>' if extras else ""
        children = _visible_children(inv, nid)
        inner = f"<ul>{''.join(li(c) for c in children)}</ul>" if children else ""
        return f"<li>{head}{escape(node.name)}{meta}{inner}</li>"

    if with_root:
        return f"<ul>{li(node_id)}</ul>"
    children = _visible_children(inv, node_id)
    return f"<ul>{''.join(li(c) for c in children)}</ul>" if children else "<p class='meta'>(leer)</p>"


def render_tree_html(inv: Inventory, root_id: str | None = None) -> str:
    """Druckansicht: Gesamtliste als Baum (oder Teilbaum)."""
    if root_id is None:
        tops = [t for t in _visible_children(inv, None) if t not in SYSTEM_IDS or inv.tree.children_ids(t)]
        body = "<h1>Inventar</h1>" + "".join(_html_tree(inv, t, with_root=True) for t in tops)
        return _page("Inventar", body)
    node = inv.node(root_id)
    body = f"<h1>{escape(node.name)}</h1>" + _html_tree(inv, root_id, with_root=False)
    return _page(node.name, body)


def render_containers_html(inv: Inventory) -> str:
    """Druckansicht: Liste aller Behälter mit Nummer und Ort."""
    tree = inv.tree
    rows = []
    containers = [
        n
        for n in inv.data.nodes.values()
        if inv.data.kinds[n.kind].kind_class is KindClass.CONTAINER and tree.is_active(n.id)
    ]
    containers.sort(key=lambda n: (n.number is None, n.number or 0, n.name.casefold()))
    for node in containers:
        place = " › ".join(tree.path_names(node.id)[:-1]) or "–"
        _, total = tree.content_counts(node.id)
        rows.append(
            f"<tr><td class='num'>{node.number if node.number is not None else ''}</td>"
            f"<td>{escape(node.name)}</td><td>{escape(inv.data.kinds[node.kind].name)}</td>"
            f"<td>{escape(place)}</td><td>{total}</td></tr>"
        )
    table = (
        "<table><thead><tr><th>Nr.</th><th>Name</th><th>Art</th><th>Ort</th><th>Inhalt</th></tr></thead>"
        f"<tbody>{''.join(rows)}</tbody></table>"
    )
    return _page("Behälter", f"<h1>Behälter</h1><p class='sub'>{len(containers)} Behälter</p>{table}")


def render_container_sheet_html(inv: Inventory, node_id: str) -> str:
    """Inhaltsblatt: Nummer und Name groß, darunter der Inhalt."""
    node = inv.node(node_id)
    tree = inv.tree
    place = " › ".join(tree.path_names(node_id)[:-1])
    number = f'<p class="big">{node.number}</p>' if node.number is not None else ""
    body = (
        f"{number}<h1 class='bigname'>{escape(node.name)}</h1>"
        f"<p class='sub'>{escape(_kind_label(inv, node_id))}"
        f"{' · ' + escape(place) if place else ''}</p>"
        "<h2>Inhalt</h2>" + _html_tree(inv, node_id, with_root=False)
    )
    return _page(f"{node.name} – Inhalt", body)


def render_packlist_html(inv: Inventory, list_id: str) -> str:
    """Packliste zum Abhaken, nach Lagerort gruppiert."""
    plist = inv.get_list(list_id)
    parts = [f"<h1>{escape(plist.name)}</h1>"]
    for group in inv.list_grouped(list_id):
        parts.append(f"<h2>{escape(group.place_name)}</h2><ul style='list-style:none;padding-left:0'>")
        for entry in group.entries:
            if entry.node is not None:
                node = inv.data.nodes[entry.node]
                name = node.name
                where = " › ".join(inv.tree.path_names(entry.node)[:-1])
            else:
                name, where = entry.text, ""
            qty = f"{entry.quantity:g}× " if entry.quantity is not None else ""
            note = f" <span class='meta'>({escape(entry.note)})</span>" if entry.note else ""
            loc = f" <span class='meta'>· {escape(where)}</span>" if where else ""
            box = "<span class='box on'></span>" if entry.checked else "<span class='box'></span>"
            parts.append(f"<li>{box}{escape(qty)}{escape(name)}{note}{loc}</li>")
        parts.append("</ul>")
    return _page(plist.name, "".join(parts))
