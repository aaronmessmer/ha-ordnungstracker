"""Migrationen, Protokoll-Rotation, Sicherungs-Aufbewahrung, JSON-Ausgabe, Benutzerdaten."""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from custom_components.ordnungstracker.core import jsonio
from custom_components.ordnungstracker.core.backup import (
    BackupInfo,
    backup_name,
    parse_backup_name,
    select_to_keep,
    sort_newest_first,
)
from custom_components.ordnungstracker.core.errors import InventoryError, NewerSchemaError
from custom_components.ordnungstracker.core.journal import Journal
from custom_components.ordnungstracker.core.migrations import file_version, migrate, needs_migration
from custom_components.ordnungstracker.core.userdata import StateData, UserData


# -- Migrationen --------------------------------------------------------------------------
def test_migration_chain_runs_in_order() -> None:
    calls: list[int] = []

    def step(n: int) -> Any:
        def run(raw: dict[str, Any]) -> dict[str, Any]:
            calls.append(n)
            raw[f"v{n + 1}"] = True
            return raw

        return run

    raw, migrated = migrate({"schema_version": 1}, {1: step(1), 2: step(2)}, 3)
    assert migrated and calls == [1, 2] and raw["schema_version"] == 3 and raw["v3"]


def test_current_version_is_untouched() -> None:
    raw, migrated = migrate({"schema_version": 1, "x": 1})
    assert not migrated and raw == {"schema_version": 1, "x": 1}
    assert needs_migration({"schema_version": 1}) is False
    assert needs_migration({"schema_version": 1}, 2) is True


def test_newer_version_raises_without_touching() -> None:
    raw = {"schema_version": 5}
    with pytest.raises(NewerSchemaError, match="nicht verändert") as info:
        migrate(raw, {}, 2)
    assert info.value.placeholders == {"file_version": 5, "supported": 2}
    assert raw == {"schema_version": 5}


def test_missing_migration_step_and_bad_version() -> None:
    with pytest.raises(InventoryError, match="keine Migration"):
        migrate({"schema_version": 1}, {}, 2)
    for bad in ({}, {"schema_version": "1"}, {"schema_version": 0}, {"schema_version": True}, []):
        with pytest.raises(InventoryError, match="schema_version"):
            file_version(bad)


# -- Protokoll ----------------------------------------------------------------------------
def test_journal_append_and_read(tmp_path: Path) -> None:
    journal = Journal(tmp_path / "verlauf.jsonl")
    journal.append([{"n": 1, "node": "a"}, {"n": 2, "node": "b"}])
    journal.append([{"n": 3, "node": "a"}])
    assert [e["n"] for e in journal.read()] == [3, 2, 1]
    assert [e["n"] for e in journal.read("a")] == [3, 1]
    assert [e["n"] for e in journal.read(limit=1)] == [3]
    assert [e["n"] for e in journal.read(limit=2, offset=1)] == [2, 1]
    journal.append([])  # nichts zu tun
    assert (tmp_path / "verlauf.jsonl").read_text().count("\n") == 3


def test_journal_rotates_and_reads_across_files(tmp_path: Path) -> None:
    journal = Journal(tmp_path / "verlauf.jsonl", max_bytes=100, keep=2)
    for n in range(12):
        journal.append([{"n": n, "pad": "x" * 30}])
    files = sorted(p.name for p in tmp_path.iterdir())
    assert files == ["verlauf.1.jsonl", "verlauf.2.jsonl", "verlauf.jsonl"]  # ältere fallen weg
    entries = journal.read(limit=100)
    numbers = [e["n"] for e in entries]
    assert numbers == sorted(numbers, reverse=True) and numbers[0] == 11
    assert len(numbers) < 12  # älteste wurden verworfen


def test_journal_skips_corrupt_lines(tmp_path: Path) -> None:
    path = tmp_path / "verlauf.jsonl"
    path.write_text('{"n": 1}\nkaputt\n{"n": 2}\n', encoding="utf-8")
    assert [e["n"] for e in Journal(path).read()] == [2, 1]
    assert Journal(tmp_path / "gibtsnicht.jsonl").read() == []


# -- Sicherungen: Aufbewahrung ------------------------------------------------------------
def test_backup_names_roundtrip() -> None:
    moment = datetime(2026, 10, 10, 9, 12, 44)
    assert backup_name(moment) == "inventar-20261010-091244.json"
    assert backup_name(moment, "vor-import") == "inventar-20261010-091244-vor-import.json"
    assert backup_name(moment, "", 2) == "inventar-20261010-091244-2.json"
    info = parse_backup_name("inventar-20261010-091244-vor-import.json")
    assert info == BackupInfo("inventar-20261010-091244-vor-import.json", moment, "vor-import")
    for bad in (
        "inventar.json",
        "x.json",
        "inventar-2026-10-10.json",
        "../inventar-20261010-091244.json",
    ):
        assert parse_backup_name(bad) is None


def _infos(moments: list[datetime]) -> list[BackupInfo]:
    return [BackupInfo(backup_name(m), m) for m in moments]


def test_retention_keeps_last_20_plus_one_per_day() -> None:
    now = datetime(2026, 10, 10, 12, 0)
    # 30 Sicherungen heute (stündlich rückwärts) -> die letzten 20 bleiben
    today = [now - timedelta(minutes=10 * i) for i in range(30)]
    keep = select_to_keep(_infos(today), now)
    newest20 = {i.name for i in sort_newest_first(_infos(today))[:20]}
    assert newest20 <= keep
    # zusätzlich: die neueste je Tag der letzten 30 Tage; heute ist durch die 20 abgedeckt
    older = [datetime(2026, 10, 10 - d, 8, 0) for d in range(1, 5)] + [datetime(2026, 10, 9, 20, 0)]
    keep = select_to_keep(_infos(today + older), now)
    names = {i.name for i in _infos(older)}
    # je Tag nur die neueste: 9.10. 20:00 statt 8:00
    assert backup_name(datetime(2026, 10, 9, 20, 0)) in keep
    assert backup_name(datetime(2026, 10, 9, 8, 0)) not in keep
    assert backup_name(datetime(2026, 10, 8, 8, 0)) in keep
    assert len(names) == 5


def test_retention_drops_older_than_30_days_beyond_last_20() -> None:
    now = datetime(2026, 10, 10, 12, 0)
    recent = [now - timedelta(days=i) for i in range(21)]  # 21 verschiedene Tage -> 20 + Rest
    ancient = [
        now - timedelta(days=45),
        now - timedelta(days=31, hours=5),
        now - timedelta(days=29),
    ]
    keep = select_to_keep(_infos(recent + ancient), now)
    assert backup_name(ancient[0]) not in keep and backup_name(ancient[1]) not in keep
    assert backup_name(ancient[2]) in keep  # jüngste 30 Tage: je ein Tag
    assert len(select_to_keep([], now)) == 0


# -- JSON-Ausgabe -------------------------------------------------------------------------
def test_jsonio_formatting_rules() -> None:
    data = {
        "a": 1,
        "kurz": {"x": 1, "y": [1, 2]},
        "lang": {"text": "x" * 120},
        "liste": [{"id": "a", "name": "A"}, {"id": "b", "name": "B"}],
        "leer": {},
        "leere_liste": [],
        "verschachtelt": {"k": {"deep": {"er": [1, 2, 3, "ä"]}}},
    }
    text = jsonio.dumps(data)
    assert '"kurz": { "x": 1, "y": [1, 2] }' in text
    assert '{ "id": "a", "name": "A" },' in text
    assert '"leer": {},' in text and '"leere_liste": []' in text
    assert '"ä"' in text  # Umlaute unverändert
    assert json.loads(text) == data
    assert jsonio.dumps(json.loads(text)) == text


# -- Benutzerdaten ------------------------------------------------------------------------
async def test_user_data_favorites_recent_prune(tmp_path: Path) -> None:
    data = UserData(tmp_path / "benutzer.json")
    await data.async_load()
    assert await data.async_set_favorite("u1", "a", True) == ["a"]
    await data.async_set_favorite("u1", "b", True)
    await data.async_set_favorite("u1", "b", True)  # doppelt: keine Wiederholung
    await data.async_set_favorite("u2", "a", True)
    assert data.favorites("u1") == ["a", "b"] and data.favorites("u2") == ["a"]  # pro Benutzer
    await data.async_set_favorite("u1", "a", False)
    assert data.favorites("u1") == ["b"]
    for n in range(25):
        await data.async_add_recent("u1", f"n{n}")
    await data.async_add_recent("u1", "n5")
    recent = data.recent("u1")
    assert len(recent) == 20 and recent[0] == "n5" and recent.count("n5") == 1
    for n in range(10):
        await data.async_add_target("u1", f"z{n}")
    await data.async_add_target("u1", "z3")
    targets = data.recent_targets("u1")
    assert len(targets) == 8 and targets[0] == "z3" and targets.count("z3") == 1
    await data.async_set_view("u1", "sort", "name")
    await data.async_set_stocktake("u1", "k1", {"present": ["a"]})
    assert data.view("u1") == {"sort": "name"} and data.stocktake("u1", "k1") == {"present": ["a"]}
    assert data.stocktake("u1", "k2") is None
    removed = await data.async_prune({"n5", "n20"})
    assert removed > 0 and set(data.recent("u1")) <= {"n5", "n20"} and data.stocktake("u1", "k1") is None
    assert data.recent_targets("u1") == []  # auch verwaiste Ziele werden entfernt
    assert await data.async_prune({"n5", "n20"}) == 0
    again = UserData(tmp_path / "benutzer.json")
    await again.async_load()
    assert again.recent("u1") == data.recent("u1")  # überlebt Neustart


async def test_state_data_and_corrupt_file(tmp_path: Path) -> None:
    state = StateData(tmp_path / "zustand.json")
    await state.async_load()
    assert state.reported == set()
    await state.async_set_reported({"b", "a"})
    again = StateData(tmp_path / "zustand.json")
    await again.async_load()
    assert again.reported == {"a", "b"}
    (tmp_path / "zustand.json").write_text("{kaputt", encoding="utf-8")
    broken = StateData(tmp_path / "zustand.json")
    await broken.async_load()
    assert broken.reported == set()
    assert (tmp_path / "zustand.json.kaputt").exists()  # beiseitegelegt statt überschrieben
