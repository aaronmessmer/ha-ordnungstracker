"""Normalisierung von Text für Suche und Sortierung (Pflichtenheft 7.2).

Beide Seiten (Suchbegriff und Daten) werden gleich gefaltet, deshalb gehen durch die
Faltung keine Treffer verloren; sie macht die Suche nur toleranter:

* Groß-/Kleinschreibung egal
* ``ß`` = ``ss``; doppeltes ``ss`` = ``s`` ("heißklebe", "heissklebe", "heisklebe" sind gleich)
* Umlaute und Akzente fallen weg: ``ü`` = ``u``; die Umschreibungen ``ue``/``ae``/``oe`` ebenso
  ("Tür", "Tuer", "tur" sind gleich)
"""

from __future__ import annotations

import re
import unicodedata

_WORD_RE = re.compile(r"[a-z0-9]+")
_NATURAL_RE = re.compile(r"(\d+)")


def fold(text: str) -> str:
    """Text für Vergleiche falten (siehe Modulbeschreibung)."""
    text = text.casefold()  # 'ß' wird dabei zu 'ss'
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    for digraph, single in (("ae", "a"), ("oe", "o"), ("ue", "u"), ("ss", "s")):
        text = text.replace(digraph, single)
    return text


def tokens(text: str) -> list[str]:
    """Gefaltete Wörter (nur Buchstaben und Ziffern)."""
    return _WORD_RE.findall(fold(text))


def normalized(text: str) -> str:
    """Gefalteter Text, Wörter durch genau ein Leerzeichen getrennt."""
    return " ".join(tokens(text))


def sort_key(text: str) -> tuple[tuple[int, int | str], ...]:
    """Sortierschlüssel mit "natürlicher" Zahlenreihenfolge (Kiste 2 vor Kiste 10)."""
    parts = _NATURAL_RE.split(fold(text))
    return tuple((0, int(p)) if p.isdigit() else (1, p) for p in parts if p != "")


def damerau_levenshtein(a: str, b: str, limit: int) -> int:
    """Editierabstand (mit Vertauschung benachbarter Zeichen), abgebrochen bei ``limit + 1``."""
    if a == b:
        return 0
    la, lb = len(a), len(b)
    if abs(la - lb) > limit:
        return limit + 1
    prev2: list[int] = []
    prev = list(range(lb + 1))
    for i in range(1, la + 1):
        cur = [i] + [0] * lb
        row_min = cur[0]
        for j in range(1, lb + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            val = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                val = min(val, prev2[j - 2] + 1)
            cur[j] = val
            row_min = min(row_min, val)
        if row_min > limit:
            return limit + 1
        prev2, prev = prev, cur
    return min(prev[lb], limit + 1)
