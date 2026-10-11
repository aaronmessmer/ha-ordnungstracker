"""Kurze, zufällige, dauerhafte Kennungen (z. B. ``n4k2q9``)."""

from __future__ import annotations

import random
import string
from collections.abc import Container

_FIRST = string.ascii_lowercase
_REST = string.ascii_lowercase + string.digits
_SYSTEM_RNG = random.SystemRandom()


def new_id(existing: Container[str], rng: random.Random | None = None) -> str:
    """Neue Kennung (ein Buchstabe, fünf Buchstaben/Ziffern), die in ``existing`` fehlt."""
    rnd = rng or _SYSTEM_RNG
    while True:
        candidate = rnd.choice(_FIRST) + "".join(rnd.choice(_REST) for _ in range(5))
        if candidate not in existing:
            return candidate
