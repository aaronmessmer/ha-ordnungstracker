"""Änderungsprotokoll ``verlauf.jsonl`` mit Rotation (Pflichtenheft 6.4)."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

MAX_BYTES = 2_000_000
KEEP_FILES = 5


class Journal:
    """Zeilenweise JSON-Datei; ab ``max_bytes`` wird rotiert (``verlauf.1.jsonl`` …)."""

    def __init__(self, path: Path, *, max_bytes: int = MAX_BYTES, keep: int = KEEP_FILES) -> None:
        self.path = path
        self.max_bytes = max_bytes
        self.keep = keep

    def _rotated(self, index: int) -> Path:
        return self.path.with_name(f"{self.path.stem}.{index}{self.path.suffix}")

    def append(self, entries: list[dict[str, Any]]) -> None:
        """Zeilen anhängen (blockierend; aus einem Thread aufrufen)."""
        if not entries:
            return
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if self.path.exists() and self.path.stat().st_size >= self.max_bytes:
            self._rotate()
        lines = "".join(json.dumps(e, ensure_ascii=False, separators=(",", ":")) + "\n" for e in entries)
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(lines)
            handle.flush()
            os.fsync(handle.fileno())

    def _rotate(self) -> None:
        oldest = self._rotated(self.keep)
        if oldest.exists():
            oldest.unlink()
        for index in range(self.keep - 1, 0, -1):
            source = self._rotated(index)
            if source.exists():
                source.replace(self._rotated(index + 1))
        self.path.replace(self._rotated(1))

    def read(self, node_id: str | None = None, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
        """Neueste Einträge zuerst; optional nur zu einem Knoten (blockierend)."""
        files = [self.path, *(self._rotated(i) for i in range(1, self.keep + 1))]
        result: list[dict[str, Any]] = []
        skipped = 0
        for file in files:
            if not file.exists():
                continue
            with file.open(encoding="utf-8") as handle:
                lines = handle.readlines()
            for line in reversed(lines):
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if node_id is not None and entry.get("node") != node_id:
                    continue
                if skipped < offset:
                    skipped += 1
                    continue
                result.append(entry)
                if len(result) >= limit:
                    return result
        return result
