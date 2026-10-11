"""Laden, Speichern, Sicherungen, Konflikte, kaputte Dateien (Pflichtenheft 6.3, 11)."""

from __future__ import annotations

import asyncio
import json
import os
from datetime import timedelta
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest

from custom_components.ordnungstracker.core import jsonio
from custom_components.ordnungstracker.core import store as store_mod
from custom_components.ordnungstracker.core.errors import (
    InvalidValueError,
    InvariantViolation,
    InventoryError,
    InventoryLoadError,
    NewerSchemaError,
    NotFoundError,
)
from custom_components.ordnungstracker.core.inventory import Inventory
from custom_components.ordnungstracker.core.sample import load_sample
from custom_components.ordnungstracker.core.store import (
    ExternalStatus,
    InventoryStore,
    parse_inventory_text,
    write_atomic,
)

from .conftest import FakeClock, by_name


@pytest.fixture
def directory(tmp_path: Path) -> Path:
    return tmp_path / "ordnungstracker"


def make_store(directory: Path, clock: FakeClock, **kwargs: Any) -> InventoryStore:
    kwargs.setdefault("save_delay", 0)
    return InventoryStore(directory, clock=clock, **kwargs)


def disk(directory: Path) -> dict[str, Any]:
    return json.loads((directory / "inventar.json").read_text("utf-8"))  # type: ignore[no-any-return]


# -- Anlegen / Laden ----------------------------------------------------------------------
async def test_first_start_creates_files_and_folders(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    inv = await store.async_load()
    assert (directory / "inventar.json").exists()
    assert (directory / "sicherungen").is_dir() and (directory / "anhaenge").is_dir()
    assert {"unsortiert", "papierkorb"} <= set(inv.data.nodes)
    assert disk(directory)["schema_version"] == 1


async def test_roundtrip_through_disk(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    await store.async_mutate(load_sample, "aaron")
    other = make_store(directory, clock)
    loaded = await other.async_load()
    assert loaded.data.to_dict() == store.inventory.data.to_dict()


async def test_mutate_returns_result_and_logs_journal(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    node = await store.async_mutate(lambda i: i.create_node("Hammer", "ding"), "aaron")
    await store.async_mutate(lambda i: i.update_node(node.id, {"name": "Fäustel"}), "mia")
    entries = await store.async_journal()
    assert [e["action"] for e in entries] == ["update", "create"]  # neueste zuerst
    assert entries[0]["user"] == "mia" and entries[0]["details"]["old"]["name"] == "Hammer"
    assert entries[1]["name"] == "Hammer" and entries[1]["user"] == "aaron"
    only = await store.async_journal(node.id, limit=1)
    assert len(only) == 1 and only[0]["action"] == "update"


async def test_move_is_logged_with_old_and_new_path(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    await store.async_mutate(load_sample, "x")
    kiste, garage = by_name(store.inventory, "Basteln"), by_name(store.inventory, "Garage")
    await store.async_mutate(lambda i: i.move_nodes([kiste], garage), "aaron")
    move = (await store.async_journal(kiste))[0]
    assert (
        move["action"] == "move"
        and move["details"]["from"][0] == "Keller"
        and move["details"]["to"][0] == "Garage"
    )


# -- Gebündeltes Speichern ----------------------------------------------------------------
async def test_changes_are_collected_then_written_once(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock, save_delay=0.05)
    await store.async_load()
    writes: list[str] = []
    original = store_mod.write_atomic
    with patch.object(store_mod, "write_atomic", side_effect=lambda p, t: (writes.append(t), original(p, t))):
        for n in range(5):
            await store.async_mutate(lambda i, n=n: i.create_node(f"N{n}", "ding"), "x")
        assert store.dirty and writes == []  # noch nichts geschrieben
        await asyncio.sleep(0.3)
    assert len(writes) == 1 and not store.dirty
    assert sum(1 for n in disk(directory)["nodes"].values() if n["name"].startswith("N")) == 5


async def test_stop_flushes_immediately(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock, save_delay=60)
    await store.async_load()
    await store.async_mutate(lambda i: i.create_node("Wichtig", "ding"), "x")
    assert "Wichtig" not in (directory / "inventar.json").read_text("utf-8")
    await store.async_stop()
    assert "Wichtig" in (directory / "inventar.json").read_text("utf-8")
    assert store._timer is None


# -- Atomar -------------------------------------------------------------------------------
def test_write_atomic_replaces_and_leaves_no_temp_files(tmp_path: Path) -> None:
    target = tmp_path / "datei.json"
    write_atomic(target, "alt")
    write_atomic(target, "neu")
    assert target.read_text() == "neu"
    assert [p.name for p in tmp_path.iterdir()] == ["datei.json"]


def test_crash_during_write_keeps_old_file(tmp_path: Path) -> None:
    """Stürzt das Schreiben ab (z. B. Platte voll), bleibt die alte Datei unversehrt (11)."""
    target = tmp_path / "inventar.json"
    write_atomic(target, '{"alt": true}')
    with patch.object(os, "fsync", side_effect=OSError("Platte voll")), pytest.raises(OSError):
        write_atomic(target, '{"neu": true}')
    assert json.loads(target.read_text()) == {"alt": True}
    assert [p.name for p in tmp_path.iterdir()] == ["inventar.json"]  # temporäre Datei aufgeräumt


async def test_failed_write_keeps_data_dirty_and_retries(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    with patch.object(store_mod, "write_atomic", side_effect=OSError("kaputt")):
        await store.async_mutate(lambda i: i.create_node("Behalten", "ding"), "x")
        assert store.dirty and isinstance(store.save_error, OSError)
    if store._timer is not None:
        store._timer.cancel()
    await store.async_flush()
    assert not store.dirty and store.save_error is None
    assert "Behalten" in (directory / "inventar.json").read_text("utf-8")
    assert len(await store.async_journal()) == 1  # Protokollzeile ging nicht verloren


# -- Regeln bei jeder Änderung ------------------------------------------------------------
async def test_mutation_that_breaks_rules_is_rolled_back(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    node = await store.async_mutate(lambda i: i.create_node("A", "ding"), "x")
    before = store.inventory.data.to_dict()

    def evil(inv: Inventory) -> None:
        inv.node(node.id).parent = "gibtsnicht"
        inv._record("evil", inv.node(node.id))

    with pytest.raises(InvariantViolation, match="zurückgenommen"):
        await store.async_mutate(evil, "x")
    assert store.inventory.data.to_dict() == before


async def test_failure_midway_rolls_back_partial_changes(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()

    def half(inv: Inventory) -> None:
        inv.create_node("Halb", "ding")
        raise InvalidValueError("Mitten drin kaputt")

    before = store.inventory.data.to_dict()
    with pytest.raises(InvalidValueError):
        await store.async_mutate(half, "x")
    assert store.inventory.data.to_dict() == before
    assert not store.dirty
    # und der Index/Baum ist danach konsistent benutzbar
    await store.async_mutate(lambda i: i.create_node("Danach", "ding"), "x")


async def test_search_index_survives_rollback(directory: Path, clock: FakeClock) -> None:
    from custom_components.ordnungstracker.core.search import SearchIndex

    store = make_store(directory, clock)
    await store.async_load()
    index = SearchIndex(store.inventory)

    def half(inv: Inventory) -> None:
        inv.create_node("Phantom", "ding")
        raise InvalidValueError("x")

    with pytest.raises(InvalidValueError):
        await store.async_mutate(half, "x")
    assert index.search("phantom").hits == []


async def test_writes_are_serialized(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    order: list[str] = []

    def op(tag: str) -> Any:
        def run(inv: Inventory) -> None:
            order.append(f"start-{tag}")
            inv.create_node(tag, "ding")
            order.append(f"end-{tag}")

        return run

    await asyncio.gather(*(store.async_mutate(op(str(n)), "x") for n in range(5)))
    assert order == [f"{p}-{n}" for n in range(5) for p in ("start", "end")]


# -- Sicherungen --------------------------------------------------------------------------
async def test_backup_before_first_write_then_hourly(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()  # Erststart: nichts zu sichern
    assert await store.async_list_backups() == []
    await store.async_mutate(lambda i: i.create_node("A", "ding"), "x")
    assert len(await store.async_list_backups()) == 1  # vor dem ersten Schreiben
    await store.async_mutate(lambda i: i.create_node("B", "ding"), "x")
    assert len(await store.async_list_backups()) == 1  # nicht öfter als stündlich
    clock.advance(minutes=59)
    await store.async_mutate(lambda i: i.create_node("C", "ding"), "x")
    assert len(await store.async_list_backups()) == 1
    clock.advance(minutes=2)
    await store.async_mutate(lambda i: i.create_node("D", "ding"), "x")
    assert len(await store.async_list_backups()) == 2


async def test_backup_contains_previous_state(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    await store.async_mutate(lambda i: i.create_node("Vorher", "ding"), "x")
    await store.async_mutate(lambda i: i.create_node("Nachher", "ding"), "x")
    (info,) = await store.async_list_backups()
    text = (directory / "sicherungen" / info.name).read_text("utf-8")
    assert "Vorher" not in text  # Sicherung stammt von vor dem ersten Schreiben nach dem Start


async def test_first_write_after_restart_backs_up_again(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    await store.async_mutate(lambda i: i.create_node("A", "ding"), "x")
    restarted = make_store(directory, clock)
    await restarted.async_load()
    await restarted.async_mutate(lambda i: i.create_node("B", "ding"), "x")
    assert len(await restarted.async_list_backups()) == 2


async def test_manual_backup_and_restore(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    await store.async_mutate(lambda i: i.create_node("Behalten", "ding"), "x")
    name = await store.async_backup("manuell")
    assert name is not None and name.endswith("-manuell.json")
    await store.async_mutate(lambda i: i.create_node("Später", "ding"), "x")
    await store.async_restore_backup(name, "aaron")
    names = {n.name for n in store.inventory.data.nodes.values()}
    assert "Behalten" in names and "Später" not in names
    assert "Später" not in (directory / "inventar.json").read_text("utf-8")
    reasons = {b.reason for b in await store.async_list_backups()}
    assert "vor-wiederherstellung" in reasons  # aktueller Stand wurde vorher gesichert
    assert (await store.async_journal())[0]["action"] == "restore"


async def test_restore_rejects_bad_names(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    with pytest.raises(NotFoundError):
        await store.async_restore_backup("../inventar.json")
    with pytest.raises(NotFoundError):
        await store.async_restore_backup("inventar-20200101-000000.json")


# -- Beschädigte Dateien ------------------------------------------------------------------
async def test_broken_json_does_not_start_empty_and_never_overwrites(
    directory: Path, clock: FakeClock
) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    await store.async_mutate(lambda i: i.create_node("Gut", "ding"), "x")
    await store.async_mutate(lambda i: i.create_node("Gut2", "ding"), "x")
    path = directory / "inventar.json"
    path.write_text('{"schema_version": 1, "nodes": {', encoding="utf-8")
    broken = path.read_text()
    again = make_store(directory, clock)
    with pytest.raises(InventoryLoadError) as info:
        await again.async_load()
    assert "kein gültiges JSON" in info.value.problems[0].message
    assert info.value.last_valid_backup is not None  # nennt die letzte gültige Sicherung
    assert path.read_text() == broken  # nichts überschrieben


async def test_rule_violations_are_listed_with_node_names(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    raw = disk(directory)
    raw["nodes"]["x1"] = {"name": "Hammer", "kind": "ding", "parent": "weg"}
    raw["nodes"]["x2"] = {"name": "Zange", "kind": "kiste", "number": 3}
    raw["nodes"]["x3"] = {"name": "Axt", "kind": "kiste", "number": 3}
    (directory / "inventar.json").write_text(json.dumps(raw), encoding="utf-8")
    with pytest.raises(InventoryLoadError) as info:
        await make_store(directory, clock).async_load()
    messages = [p.message for p in info.value.problems]
    assert any("Hammer" in m for m in messages) and any("doppelt" in m for m in messages)
    assert "und 1 weitere" in info.value.message


def test_parse_text_errors() -> None:
    with pytest.raises(InventoryLoadError, match="JSON-Objekt"):
        parse_inventory_text("[1, 2]")
    with pytest.raises(InventoryLoadError, match="schema_version"):
        parse_inventory_text("{}")
    with pytest.raises(InventoryLoadError) as info:
        parse_inventory_text('{"schema_version": 1, "nodes": 5}')
    assert info.value.problems


# -- Versionen / Migration ----------------------------------------------------------------
async def test_newer_version_is_left_alone(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    raw = disk(directory)
    raw["schema_version"] = 99
    text = json.dumps(raw)
    (directory / "inventar.json").write_text(text, encoding="utf-8")
    with pytest.raises(NewerSchemaError, match="nicht verändert"):
        await make_store(directory, clock).async_load()
    assert (directory / "inventar.json").read_text() == text


async def test_migrated_file_gets_pre_migration_backup_and_is_saved(
    directory: Path, clock: FakeClock
) -> None:
    from custom_components.ordnungstracker.core import migrations

    store = make_store(directory, clock)
    await store.async_load()
    original = (directory / "inventar.json").read_text("utf-8")

    def v1_to_2(raw: dict[str, Any]) -> dict[str, Any]:
        raw["nodes"]["unsortiert"]["note"] = "migriert"
        return raw

    with patch.object(store_mod, "migrate", lambda raw, mig=None: migrations.migrate(raw, {1: v1_to_2}, 2)):
        migrated_store = make_store(directory, clock)
        inv = await migrated_store.async_load()
    assert inv.data.nodes["unsortiert"].note == "migriert"
    assert disk(directory)["schema_version"] == 2  # migrierte Fassung gespeichert
    (backup,) = [b for b in await migrated_store.async_list_backups() if b.reason == "vor-migration"]
    assert (directory / "sicherungen" / backup.name).read_text("utf-8") == original  # Original gesichert


# -- Änderungen von Hand ------------------------------------------------------------------
async def test_external_edit_without_unsaved_changes_reloads(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    assert (await store.async_check_external()).status is ExternalStatus.UNCHANGED
    raw = disk(directory)
    raw["nodes"]["h1"] = {"name": "Von Hand", "kind": "ding"}
    (directory / "inventar.json").write_text(jsonio.dumps(raw), encoding="utf-8")
    result = await store.async_check_external()
    assert result.status is ExternalStatus.RELOADED
    assert "h1" in store.inventory.data.nodes
    assert (await store.async_check_external()).status is ExternalStatus.UNCHANGED


async def test_external_edit_with_unsaved_changes_creates_conflict_file(
    directory: Path, clock: FakeClock
) -> None:
    store = make_store(directory, clock, save_delay=60)
    await store.async_load()
    await store.async_mutate(lambda i: i.create_node("Meine Änderung", "ding"), "x")
    raw = disk(directory)
    raw["nodes"]["h1"] = {"name": "Von Hand", "kind": "ding"}
    external_text = jsonio.dumps(raw)
    (directory / "inventar.json").write_text(external_text, encoding="utf-8")
    result = await store.async_check_external()
    assert result.status is ExternalStatus.CONFLICT and result.conflict_file is not None
    assert (directory / "inventar.json").read_text() == external_text  # fremde Änderung bleibt unangetastet
    assert "Meine Änderung" in (directory / result.conflict_file).read_text("utf-8")
    assert "h1" in store.inventory.data.nodes and not store.dirty
    store._timer and store._timer.cancel()


async def test_invalid_external_edit_blocks_writes_until_fixed(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    good = (directory / "inventar.json").read_text("utf-8")
    (directory / "inventar.json").write_text("{kaputt", encoding="utf-8")
    result = await store.async_check_external()
    assert result.status is ExternalStatus.INVALID and result.problems
    assert store.blocked_reason and "von Hand" in store.blocked_reason
    with pytest.raises(InventoryError, match="Korrigiere"):
        await store.async_mutate(lambda i: i.create_node("X", "ding"), "x")
    assert (directory / "inventar.json").read_text() == "{kaputt"
    (directory / "inventar.json").write_text(good, encoding="utf-8")
    assert (await store.async_check_external()).status is ExternalStatus.RELOADED
    assert store.blocked_reason is None
    await store.async_mutate(lambda i: i.create_node("X", "ding"), "x")


async def test_invalid_external_edit_with_unsaved_changes_saves_conflict_copy(
    directory: Path, clock: FakeClock
) -> None:
    store = make_store(directory, clock, save_delay=60)
    await store.async_load()
    await store.async_mutate(lambda i: i.create_node("Ungespeichert", "ding"), "x")
    (directory / "inventar.json").write_text("{kaputt", encoding="utf-8")
    result = await store.async_check_external()
    assert result.status is ExternalStatus.INVALID and result.conflict_file
    assert "Ungespeichert" in (directory / result.conflict_file).read_text("utf-8")
    store._timer and store._timer.cancel()


async def test_forced_reload_service(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    raw = disk(directory)
    raw["nodes"]["h1"] = {"name": "Von Hand", "kind": "ding"}
    # Dateiinhalt ändert sich, Größe/Zeit bleiben gleich: force erkennt es trotzdem
    (directory / "inventar.json").write_text(jsonio.dumps(raw), encoding="utf-8")
    assert (await store.async_check_external()).status is ExternalStatus.RELOADED


async def test_missing_file_during_check_is_ignored(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    (directory / "inventar.json").unlink()
    assert (await store.async_check_external()).status is ExternalStatus.UNCHANGED


# -- Import / Export ----------------------------------------------------------------------
async def test_export_and_import(directory: Path, clock: FakeClock, tmp_path: Path) -> None:
    source = make_store(tmp_path / "quelle", clock)
    await source.async_load()
    await source.async_mutate(load_sample, "x")
    text = await source.async_export_text()
    target = make_store(directory, clock)
    await target.async_load()
    await target.async_mutate(lambda i: i.create_node("Wird ersetzt", "ding"), "x")
    await target.async_import_text(text, "aaron")
    assert target.inventory.data.to_dict() == source.inventory.data.to_dict()
    assert "Wird ersetzt" not in (directory / "inventar.json").read_text("utf-8")
    assert "vor-import" in {b.reason for b in await target.async_list_backups()}
    assert (await target.async_journal())[0]["action"] == "import"


async def test_invalid_import_changes_nothing(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    before = store.inventory.data.to_dict()
    with pytest.raises(InventoryLoadError):
        await store.async_import_text('{"schema_version": 1, "nodes": {"a": {"name": "x"}}}')
    assert store.inventory.data.to_dict() == before


# -- Pflege -------------------------------------------------------------------------------
async def test_housekeeping_purges_expired_trash(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    node = await store.async_mutate(lambda i: i.create_node("Alt", "ding"), "x")
    await store.async_mutate(lambda i: i.delete_node(node.id), "x")
    assert await store.async_housekeeping() == 0
    clock.advance(days=31)
    assert await store.async_housekeeping() == 1
    assert node.id not in disk(directory)["nodes"]


async def test_normalization_is_saved_on_load(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock)
    await store.async_load()
    raw = disk(directory)
    raw["nodes"]["a"] = {"name": "Mit Kind", "kind": "ding"}
    raw["nodes"]["b"] = {"name": "Kind", "kind": "ding", "parent": "a"}
    (directory / "inventar.json").write_text(json.dumps(raw), encoding="utf-8")
    loaded = make_store(directory, clock)
    await loaded.async_load()
    assert disk(directory)["nodes"]["a"]["kind"] == "gruppe"


async def test_long_delay_is_cancelled_by_flush(directory: Path, clock: FakeClock) -> None:
    store = make_store(directory, clock, save_delay=3600, backup_interval=timedelta(hours=1))
    await store.async_load()
    await store.async_mutate(lambda i: i.create_node("A", "ding"), "x")
    assert store._timer is not None
    await store.async_flush()
    assert store._timer is None and not store.dirty


def test_store_requires_load() -> None:
    with pytest.raises(RuntimeError, match="geladen"):
        _ = InventoryStore(Path("/nonexistent"), clock=FakeClock()).inventory
