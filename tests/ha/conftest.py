"""Testkonfiguration der Home-Assistant-Schicht."""

import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Eigene Integrationen in der Testinstanz von Home Assistant zulassen."""
