"""Die Oberfläche (frontend/src/lib/api.ts) darf nur Befehle und Felder verwenden, die der Server kennt."""

from __future__ import annotations

import re
from pathlib import Path

from custom_components.ordnungstracker import websocket_api as ws

ROOT = Path(__file__).resolve().parents[2]
API_TS = (ROOT / "frontend" / "src" / "lib" / "api.ts").read_text("utf-8")
BUNDLE = ROOT / "custom_components" / "ordnungstracker" / "frontend" / "ordnungstracker.js"

_CALL = re.compile(r'this\.call(?:<[^(]*?>)?\(\s*"(\w+)"(?:\s*,\s*([^;]*?))?\)\s*[;,\n]', re.S)
_FIELD = re.compile(r"[{,]\s*(\w+)\s*(?=[:,}])")


def _server_fields(command: str) -> set[str]:
    fields = (ws.READ.get(command) or ws.WRITE[command])[0]
    return {str(getattr(key, "schema", key)) for key in fields}


def _used() -> dict[str, set[str]]:
    used: dict[str, set[str]] = {}
    for command, args in _CALL.findall(API_TS):
        names = {n for n in _FIELD.findall(args or "") if n not in {"true", "false"}}
        used.setdefault(command, set()).update(names)
    return used


def test_frontend_commands_exist_with_known_fields() -> None:
    used = _used()
    assert len(used) > 25  # the pattern really found the calls
    for command, names in used.items():
        assert command in ws.READ or command in ws.WRITE, f"unknown command {command}"
        unknown = names - _server_fields(command)
        assert not unknown, f"{command}: server does not accept {sorted(unknown)}"


def test_api_ts_uses_no_reserved_field_names() -> None:
    for names in _used().values():
        assert not names & {"id", "type"}


def test_bundle_is_committed_and_registers_the_elements() -> None:
    text = BUNDLE.read_text("utf-8")
    for name in ("ordnungstracker-panel", "ordnungstracker-card", "ordnungstracker-card-editor"):
        assert name in text
