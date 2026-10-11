"""Fehlertypen des Kerns.

Jede Fehlermeldung ist deutsch, konkret und nennt einen Handlungshinweis. Zusätzlich trägt
jeder Fehler einen stabilen ``code`` und ``placeholders``, damit die Home-Assistant-Schicht
die Meldung über Übersetzungsschlüssel in andere Sprachen ausgeben kann.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


class InventoryError(Exception):
    """Basisklasse für alle erwartbaren Fehler (falsche Eingabe, verletzte Regel)."""

    code = "error"

    def __init__(self, message: str, **placeholders: Any) -> None:
        super().__init__(message)
        self.message = message
        self.placeholders: dict[str, Any] = placeholders


class NotFoundError(InventoryError):
    """Ein Knoten, eine Art, Person, Felddefinition, Liste oder Vorlage existiert nicht."""

    code = "not_found"


class InvalidValueError(InventoryError):
    """Ein übergebener Wert ist ungültig."""

    code = "invalid_value"


class CycleError(InventoryError):
    """Verschieben würde einen Kreis erzeugen (Knoten in sich selbst)."""

    code = "cycle"


class NumberTakenError(InventoryError):
    """Die Nummer ist im Inventar schon vergeben."""

    code = "number_taken"


class SystemNodeError(InventoryError):
    """Systemknoten (Unsortiert, Papierkorb) dürfen nicht gelöscht oder verschoben werden."""

    code = "system_node"


class InUseError(InventoryError):
    """Etwas wird noch verwendet und kann deshalb nicht gelöscht werden."""

    code = "in_use"


class TrashError(InventoryError):
    """Die Aktion ist für Knoten im Papierkorb nicht erlaubt."""

    code = "trash"


class NewerSchemaError(InventoryError):
    """Die Datei stammt von einer neueren Version als die installierte Integration."""

    code = "newer_schema"


class InvariantViolation(InventoryError):
    """Eine Änderung hätte eine Regel aus Pflichtenheft 5.14 verletzt (wurde zurückgenommen)."""

    code = "invariant_violation"


@dataclass(frozen=True, slots=True)
class Problem:
    """Ein Befund beim Prüfen einer Datei oder des Inventars."""

    code: str
    message: str
    node_id: str | None = None
    node_name: str | None = None
    data: dict[str, Any] = field(default_factory=dict)

    def __str__(self) -> str:
        return self.message


class InventoryLoadError(InventoryError):
    """Die Inventardatei ist ungültig; es wird nichts überschrieben (Pflichtenheft 6.3)."""

    code = "load_failed"

    def __init__(
        self,
        message: str,
        problems: list[Problem],
        last_valid_backup: str | None = None,
    ) -> None:
        super().__init__(message)
        self.problems = problems
        self.last_valid_backup = last_valid_backup
