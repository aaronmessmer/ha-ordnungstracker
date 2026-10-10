"""Sprachabfrage über Assist: Sätze, Absichten, Antworten (Pflichtenheft 9.7)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from homeassistant.components import conversation
from homeassistant.core import Context, HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ordnungstracker import voice
from custom_components.ordnungstracker.core.sample import load_sample


async def ask(hass: HomeAssistant, text: str) -> str:
    result = await conversation.async_converse(hass, text, None, Context(), language="de")
    assert result.response.response_type.value in ("action_done", "query_answer"), (
        text,
        result.response.speech,
        result.response.error_code if hasattr(result.response, "error_code") else None,
    )
    return str(result.response.speech["plain"]["speech"])


async def _setup_assist(hass: HomeAssistant) -> None:
    for domain in ("homeassistant", "intent", "conversation"):
        assert await async_setup_component(hass, domain, {})
    await hass.async_block_till_done()


@pytest.fixture
async def assist(hass: HomeAssistant, init_integration: MockConfigEntry) -> MockConfigEntry:
    await init_integration.runtime_data.async_mutate(load_sample)
    await _setup_assist(hass)
    return init_integration


def test_sentences_are_installed_and_updated(tmp_path: Path) -> None:
    assert voice._install_sentences(tmp_path) is True
    target = tmp_path.joinpath(*voice.SENTENCES_TARGET)
    assert target.read_text(encoding="utf-8") == voice.SENTENCES_SOURCE.read_text(encoding="utf-8")
    assert voice._install_sentences(tmp_path) is False  # unchanged: nothing is touched
    target.write_text("veraltet", encoding="utf-8")
    assert voice._install_sentences(tmp_path) is True


async def test_sentences_land_in_the_config_folder(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    assert Path(hass.config.path(*voice.SENTENCES_TARGET)).is_file()


@pytest.mark.parametrize(
    "question",
    [
        "wo ist die Heißklebepistole",
        "wo finde ich die Heißklebepistole",
        "wo liegt meine Heißklebepistole",
        "wo habe ich die Heißklebepistole hingelegt",
    ],
)
async def test_where_questions(assist: Any, hass: HomeAssistant, question: str) -> None:
    answer = await ask(hass, question)
    assert "Heißklebepistole liegt in Bastelsachen, Kiste 14 Basteln, Regal B, Keller" in answer
    assert "ausgeliehen an Nachbar Huber" in answer


@pytest.mark.parametrize(
    "question", ["was ist in Kiste 14", "was ist in der Kiste 14", "was liegt in Box 14"]
)
async def test_contents_by_number(assist: Any, hass: HomeAssistant, question: str) -> None:
    answer = await ask(hass, question)
    assert answer.startswith("In Kiste 14 Basteln ist ein Eintrag: Bastelsachen")


async def test_contents_by_name_and_unknown(assist: Any, hass: HomeAssistant) -> None:
    assert "Kiste 14 Basteln" in await ask(hass, "was ist in Basteln")
    assert "nicht gefunden" in await ask(hass, "wo ist der Zeppelin")
    assert "gibt es nicht" in await ask(hass, "was ist in Kiste 999")


async def test_answers_when_not_loaded(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    await _setup_assist(hass)
    await hass.config_entries.async_unload(init_integration.entry_id)
    await hass.async_block_till_done()
    assert "nicht geladen" in await ask(hass, "wo ist die Schere")


def test_sentence_lists_do_not_clash_with_home_assistant_names() -> None:
    import yaml

    data = yaml.safe_load(voice.SENTENCES_SOURCE.read_text(encoding="utf-8"))
    assert set(data["lists"]) == {"ding", "ort", "nummer"}
    assert not set(data["lists"]) & {"name", "area", "floor", "domain", "device_class", "state"}
    assert set(data["intents"]) == {voice.INTENT_WHERE, voice.INTENT_CONTENTS}
