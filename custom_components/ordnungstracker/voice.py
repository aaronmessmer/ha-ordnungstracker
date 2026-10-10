"""Sprachabfrage über Assist (Pflichtenheft 9.7): zwei Fragen, nur lesend.

Die Sätze liegen in ``sentences/de.yaml`` und werden nach ``<config>/custom_sentences/de/`` kopiert,
weil Assist eigene Sätze nur dort lädt. Die Antworten bildet der Kern (``core/voice.py``).
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers import intent

from .core import voice
from .views import get_runtime

_LOGGER = logging.getLogger(__name__)

INTENT_WHERE = "OrdnungWoIst"
INTENT_CONTENTS = "OrdnungInhalt"
SENTENCES_SOURCE = Path(__file__).parent / "sentences" / "de.yaml"
SENTENCES_TARGET = ("custom_sentences", "de", "ordnungstracker.yaml")
MARKER = "# ordnungstracker-managed:"
NOT_LOADED = "Der Ordnungs-Tracker ist gerade nicht geladen."


class WhereIntent(intent.IntentHandler):
    """„Wo ist {Ding}?“"""

    intent_type = INTENT_WHERE
    description = "Sagt, wo ein Ding im Haushalt liegt"

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        runtime = get_runtime(intent_obj.hass)
        if runtime is None or runtime.index is None:
            text = NOT_LOADED
        else:
            ding = str(intent_obj.slots.get("ding", {}).get("value", ""))
            text = voice.answer_where(runtime.inventory, runtime.index, ding)
        response = intent_obj.create_response()
        response.async_set_speech(text)
        return response


class ContentsIntent(intent.IntentHandler):
    """„Was ist in Kiste {Nummer}?“ und „Was ist in {Name}?“"""

    intent_type = INTENT_CONTENTS
    description = "Nennt den Inhalt einer Kiste oder eines Ortes"
    # Genau eines der Felder `nummer` und `name` kommt vor; deshalb gibt es kein Schema.

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        slots = intent_obj.slots
        runtime = get_runtime(intent_obj.hass)
        if runtime is None or runtime.index is None:
            text = NOT_LOADED
        elif "nummer" in slots:
            text = voice.answer_contents_by_number(runtime.inventory, int(slots["nummer"]["value"]))
        else:
            text = voice.answer_contents_by_name(
                runtime.inventory, runtime.index, str(slots.get("ort", {}).get("value", ""))
            )
        response = intent_obj.create_response()
        response.async_set_speech(text)
        return response


def async_register_intents(hass: HomeAssistant) -> None:
    """Die beiden Absichten anmelden (einmal je Home Assistant)."""
    intent.async_register(hass, WhereIntent())
    intent.async_register(hass, ContentsIntent())


def _install_sentences(config_dir: Path) -> bool:
    """Sätze nach ``custom_sentences/de/`` kopieren, wenn sie neu oder geändert sind (blockierend)."""
    target = config_dir.joinpath(*SENTENCES_TARGET)
    text = SENTENCES_SOURCE.read_text(encoding="utf-8")
    if target.exists():
        current = target.read_text(encoding="utf-8")
        if current == text:
            return False
        if not current.startswith(MARKER):  # the user took the file over: never overwrite it
            _LOGGER.debug("Die Satzdatei %s wird selbst gepflegt und nicht überschrieben", target)
            return False
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")
    return True


async def async_install_sentences(hass: HomeAssistant) -> None:
    """Beispielsätze für Assist bereitstellen; ein Fehler (z. B. schreibgeschützter Ordner) stört nichts."""
    try:
        changed = await hass.async_add_executor_job(_install_sentences, Path(hass.config.config_dir))
    except OSError as err:
        _LOGGER.warning("Die Sätze für Assist konnten nicht angelegt werden: %s", err)
        return
    if changed and hass.services.has_service("conversation", "reload"):
        await hass.services.async_call("conversation", "reload", {"language": "de"}, blocking=False)
