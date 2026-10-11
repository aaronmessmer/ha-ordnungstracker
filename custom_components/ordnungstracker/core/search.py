"""Suche mit Suchindex im Speicher (Pflichtenheft 7).

Der Index hält pro aktivem Knoten einen vorberechneten Datensatz mit gefaltetem Text und wird
bei Änderungen gezielt aktualisiert (``Inventory.subscribe``). Eine Suche prüft jeden Begriff
gegen die Datensätze, kombiniert die Begriffe (alle müssen vorkommen) und sortiert nach
Treffergüte (7.3).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING

from .model import TRASH_ID, Condition, KindClass
from .reminders import Hint, node_hints, stale_nodes
from .textnorm import damerau_levenshtein, fold, normalized, sort_key, tokens

if TYPE_CHECKING:
    from .inventory import Change, Inventory

# Güte-Stufen (kleiner = besser), Pflichtenheft 7.3
LEVEL_NUMBER = 5
LEVEL_NAME_EXACT = 0
LEVEL_NAME_PREFIX = 10
LEVEL_NAME_WORD = 20
LEVEL_NAME_PART = 30
LEVEL_ALIAS = 40
LEVEL_ALIAS_PART = 42
LEVEL_TAG = 44
LEVEL_TAG_PART = 46
LEVEL_NOTE = 50
LEVEL_FIELD = 52
LEVEL_CHECKOUT = 54
LEVEL_PATH = 60
LEVEL_FUZZY = 70
SYNONYM_PENALTY = 100  # Synonymtreffer stehen hinter allen direkten Treffern

_LABELS = {
    LEVEL_NUMBER: "number",
    LEVEL_NAME_EXACT: "name",
    LEVEL_NAME_PREFIX: "name",
    LEVEL_NAME_WORD: "name",
    LEVEL_NAME_PART: "name",
    LEVEL_ALIAS: "alias",
    LEVEL_ALIAS_PART: "alias",
    LEVEL_TAG: "tag",
    LEVEL_TAG_PART: "tag",
    LEVEL_NOTE: "note",
    LEVEL_FIELD: "field",
    LEVEL_CHECKOUT: "checkout",
    LEVEL_PATH: "path",
    LEVEL_FUZZY: "fuzzy",
}
_NUMBER_QUERY = re.compile(r"^\s*#?\s*(\d+)\s*$")
_FUZZY_MIN_LENGTH = 4


@dataclass(slots=True)
class SearchFilter:
    """Kombinierbare Filter (7.4). ``None`` = nicht filtern."""

    kinds: frozenset[str] | None = None
    classes: frozenset[KindClass] | None = None
    within: str | None = None
    owner: str | None = None
    tag: str | None = None
    condition: Condition | None = None
    checked_out: bool | None = None
    has_number: bool | None = None
    empty: bool | None = None
    stale: bool | None = None
    include_archived: bool = False


@dataclass(slots=True)
class SearchHit:
    """Ein Treffer samt Pfad, wirksamem Besitzer, Hinweisen und Fundstelle (7.5)."""

    node_id: str
    name: str
    kind: str
    kind_class: KindClass
    number: int | None
    path: list[tuple[str, str]]
    owner: str | None
    owner_inherited: bool
    hints: list[Hint]
    matched_in: str
    score: int
    archived: bool = False


@dataclass(slots=True)
class SearchResult:
    """Ergebnis einer Suche; ``total`` zählt auch Treffer jenseits von ``limit``."""

    hits: list[SearchHit]
    total: int
    number_hit: str | None = None  # Kennung des Knotens, auf den eine Nummerneingabe springt


@dataclass(slots=True)
class _Rec:
    id: str
    name_n: str
    alias_n: str
    tag_n: str
    note_n: str
    field_n: str
    checkout_n: str
    path_n: str
    number: str
    kind: str
    kind_class: KindClass
    depth: int
    archived: bool
    name_sort: tuple[tuple[int, int | str], ...]
    vocab: tuple[str, ...]


def _level_of(rec: _Rec, term: str) -> int | None:
    """Beste Güte, mit der ``term`` im Knoten selbst (ohne Pfad) vorkommt."""
    if rec.number and term == rec.number:
        return LEVEL_NUMBER
    name = rec.name_n
    if term in name:
        if name == term:
            return LEVEL_NAME_EXACT
        if name.startswith(term):
            return LEVEL_NAME_PREFIX
        if f" {term}" in name:
            return LEVEL_NAME_WORD
        return LEVEL_NAME_PART
    if rec.alias_n and term in rec.alias_n:
        return LEVEL_ALIAS if rec.alias_n.startswith(term) or f" {term}" in rec.alias_n else LEVEL_ALIAS_PART
    if rec.tag_n and term in rec.tag_n:
        return LEVEL_TAG if rec.tag_n.startswith(term) or f" {term}" in rec.tag_n else LEVEL_TAG_PART
    if rec.note_n and term in rec.note_n:
        return LEVEL_NOTE
    if rec.field_n and term in rec.field_n:
        return LEVEL_FIELD
    if rec.checkout_n and term in rec.checkout_n:
        return LEVEL_CHECKOUT
    return None


class SearchIndex:
    """Suchindex über ein ``Inventory``; hält sich über Änderungsmeldungen aktuell."""

    def __init__(self, inventory: Inventory) -> None:
        self.inventory = inventory
        self._recs: dict[str, _Rec] = {}
        self._vocab: dict[str, set[str]] = {}
        self.rebuild()
        inventory.subscribe(self._on_change)

    # -- Pflege ---------------------------------------------------------------------------
    def rebuild(self) -> None:
        """Vollständig neu aufbauen."""
        self._recs.clear()
        self._vocab.clear()
        for nid in self.inventory.data.nodes:
            self._add(nid)

    def _on_change(self, change: Change) -> None:
        if change.touched is None:
            self.rebuild()
            return
        for nid in change.touched:
            self._remove(nid)
            if nid in self.inventory.data.nodes:
                self._add(nid)

    def _remove(self, node_id: str) -> None:
        rec = self._recs.pop(node_id, None)
        if rec is None:
            return
        for word in rec.vocab:
            ids = self._vocab.get(word)
            if ids is not None:
                ids.discard(node_id)
                if not ids:
                    del self._vocab[word]

    def _add(self, node_id: str) -> None:
        inv = self.inventory
        tree = inv.tree
        node = inv.data.nodes[node_id]
        if node_id == TRASH_ID or tree.in_trash(node_id):
            return
        ancestors = tree.ancestors(node_id)
        nodes = inv.data.nodes
        field_parts: list[str] = []
        for fid, value in node.fields.items():
            definition = inv.data.fields.get(fid)
            if definition is None or isinstance(value, bool):
                continue
            field_parts.append(normalized(str(value)))
        checkout_n = ""
        if node.checkout is not None:
            checkout_n = normalized(f"{node.checkout.to} {node.checkout.note}")
        name_n = normalized(node.name)
        alias_n = normalized(" ".join(node.aliases))
        tag_n = normalized(" ".join(node.tags))
        vocab = tuple(
            {w for w in (*name_n.split(), *alias_n.split(), *tag_n.split()) if len(w) >= _FUZZY_MIN_LENGTH}
        )
        rec = _Rec(
            id=node_id,
            name_n=name_n,
            alias_n=alias_n,
            tag_n=tag_n,
            note_n=normalized(node.note),
            field_n=" ".join(p for p in field_parts if p),
            checkout_n=checkout_n,
            path_n=normalized(" ".join(nodes[a].name for a in ancestors)),
            number=str(node.number) if node.number is not None else "",
            kind=node.kind,
            kind_class=inv.data.kinds[node.kind].kind_class,
            depth=len(ancestors),
            archived=tree.is_archived(node_id),
            name_sort=sort_key(node.name),
            vocab=vocab,
        )
        self._recs[node_id] = rec
        for word in vocab:
            self._vocab.setdefault(word, set()).add(node_id)

    # -- Suche ----------------------------------------------------------------------------
    def _synonyms_for(self, term: str, folded_query: str) -> list[str]:
        """Alternativen zu ``term`` aus den Synonymgruppen (5.12)."""
        alternatives: list[str] = []
        for group in self.inventory.data.synonyms:
            members = [normalized(m) for m in group]
            if term in members or folded_query in members:
                alternatives.extend(m for m in members if m and m not in (term, folded_query))
        return list(dict.fromkeys(alternatives))

    def _candidates(self, flt: SearchFilter) -> list[_Rec]:
        inv = self.inventory
        tree = inv.tree
        recs: list[_Rec] = list(self._recs.values())
        if not flt.include_archived:
            recs = [r for r in recs if not r.archived]
        if flt.within is not None:
            if flt.within not in inv.data.nodes:
                return []
            subtree = set(tree.descendants(flt.within))
            recs = [r for r in recs if r.id in subtree]
        if flt.kinds is not None:
            recs = [r for r in recs if r.kind in flt.kinds]
        if flt.classes is not None:
            recs = [r for r in recs if r.kind_class in flt.classes]
        nodes = inv.data.nodes
        if flt.tag is not None:
            wanted = fold(flt.tag).strip()
            recs = [r for r in recs if wanted in {fold(t).strip() for t in nodes[r.id].tags}]
        if flt.condition is not None:
            recs = [r for r in recs if nodes[r.id].condition is flt.condition]
        if flt.checked_out is not None:
            recs = [r for r in recs if (nodes[r.id].checkout is not None) == flt.checked_out]
        if flt.has_number is not None:
            recs = [r for r in recs if (nodes[r.id].number is not None) == flt.has_number]
        if flt.empty is not None:
            recs = [
                r
                for r in recs
                if (
                    r.kind_class is not KindClass.ITEM
                    and not any(nodes[c].condition is not Condition.DISPOSED for c in tree.children_ids(r.id))
                )
                == flt.empty
            ]
        if flt.stale is not None:
            stale = stale_nodes(inv)
            recs = [r for r in recs if (r.id in stale) == flt.stale]
        if flt.owner is not None:
            recs = [r for r in recs if tree.effective_owner(r.id)[0] == flt.owner]
        return recs

    def search(
        self, query: str = "", flt: SearchFilter | None = None, limit: int | None = 50
    ) -> SearchResult:
        """Suchen. Ohne Suchbegriff werden nur die Filter angewendet (7.4)."""
        flt = flt or SearchFilter()
        inv = self.inventory
        candidates = self._candidates(flt)
        scored: dict[str, tuple[int, str]] = {}

        number_hit: str | None = None
        number_match = _NUMBER_QUERY.match(query)
        if number_match:
            holder = inv.find_by_number(int(number_match.group(1)))
            if holder is not None and holder.id in self._recs:
                rec = self._recs[holder.id]
                if any(c.id == rec.id for c in candidates):
                    number_hit = holder.id

        terms = tokens(query)
        if not terms and query.strip() and number_hit is None:
            return SearchResult([], 0)  # z. B. nur Satzzeichen: nichts zu suchen
        if not terms:
            for rec in candidates:
                scored[rec.id] = (LEVEL_NAME_EXACT, "filter")
        else:
            scored = self._match(terms, normalized(query), candidates)

        ordered = sorted(
            scored,
            key=lambda nid: (
                nid != number_hit,
                scored[nid][0],
                0 if self._recs[nid].kind_class in (KindClass.ITEM, KindClass.GROUP) else 1,
                self._recs[nid].depth,
                self._recs[nid].name_sort,
            ),
        )
        if number_hit is not None and number_hit not in scored:
            ordered.insert(0, number_hit)
            scored[number_hit] = (LEVEL_NUMBER, "number")
        total = len(ordered)
        if limit is not None:
            ordered = ordered[:limit]
        hits = [self._hit(nid, *scored[nid]) for nid in ordered]
        return SearchResult(hits, total, number_hit)

    def _match(self, terms: list[str], query_n: str, candidates: list[_Rec]) -> dict[str, tuple[int, str]]:
        # je Begriff: Datensatz-Kennung -> (Güte, ist_Pfadtreffer)
        per_term: list[dict[str, tuple[int, bool]]] = []
        for term in terms:
            alternatives = [
                (term, 0),
                *((alt, SYNONYM_PENALTY) for alt in self._synonyms_for(term, query_n)),
            ]
            found: dict[str, tuple[int, bool]] = {}
            for rec in candidates:
                best: int | None = None
                for alt, penalty in alternatives:
                    level = _level_of(rec, alt)
                    if level is not None and (best is None or level + penalty < best):
                        best = level + penalty
                if best is not None:
                    found[rec.id] = (best, False)
                elif rec.path_n and any(alt in rec.path_n for alt, _ in alternatives):
                    found[rec.id] = (LEVEL_PATH, True)
            if not found and len(term) >= _FUZZY_MIN_LENGTH:
                found = self._fuzzy(term, {c.id for c in candidates})
            per_term.append(found)

        if any(not found for found in per_term):
            return {}
        common = set(per_term[0])
        for found in per_term[1:]:
            common &= set(found)
        result: dict[str, tuple[int, str]] = {}
        for nid in common:
            own = [found[nid][0] for found in per_term if not found[nid][1]]
            if not own:
                continue  # nur über den Pfad getroffen: kein eigener Treffer
            score = max(own)
            if len(terms) > 1 and self._recs[nid].name_n == query_n:
                score = LEVEL_NAME_EXACT
            result[nid] = (score, _label(score))
        return result

    def _fuzzy(self, term: str, allowed: set[str]) -> dict[str, tuple[int, bool]]:
        limit = 1 if len(term) < 8 else 2
        found: dict[str, tuple[int, bool]] = {}
        for word, ids in self._vocab.items():
            if abs(len(word) - len(term)) > limit:
                continue
            if damerau_levenshtein(term, word, limit) <= limit:
                for nid in ids:
                    if nid in allowed:
                        found[nid] = (LEVEL_FUZZY, False)
        return found

    def _hit(self, node_id: str, score: int, matched_in: str) -> SearchHit:
        inv = self.inventory
        node = inv.data.nodes[node_id]
        rec = self._recs[node_id]
        owner, inherited = inv.tree.effective_owner(node_id)
        return SearchHit(
            node_id=node_id,
            name=node.name,
            kind=node.kind,
            kind_class=rec.kind_class,
            number=node.number,
            path=[(i, inv.data.nodes[i].name) for i in inv.tree.path_ids(node_id)],
            owner=owner,
            owner_inherited=inherited,
            hints=node_hints(inv, node_id),
            matched_in=matched_in,
            score=score,
            archived=rec.archived,
        )


def _label(score: int) -> str:
    """Fundstelle zu einer Güte; Synonymtreffer heißen ``synonym``."""
    if score >= SYNONYM_PENALTY:
        return "synonym"
    for level in sorted(_LABELS, reverse=True):
        if score >= level:
            return _LABELS[level]
    return "name"
