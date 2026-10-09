"""Konstanten des Ordnungs-Trackers."""

from typing import Final

DOMAIN: Final = "ordnungstracker"
NAME: Final = "Ordnungs-Tracker"

# Ordner im Home-Assistant-Konfigurationsverzeichnis (Pflichtenheft 6.1).
DATA_DIR_NAME: Final = "ordnungstracker"

# Optionen (Pflichtenheft 9.1)
CONF_TODO_ENTITY: Final = "todo_entity"
CONF_SHOW_SIDEBAR: Final = "show_sidebar"

# Ereignis, wenn ein Eintrag neu fällig wird (Pflichtenheft 9.6)
EVENT_DUE: Final = "ordnungstracker_due"

# Auslieferung der Oberfläche
STATIC_URL: Final = "/ordnungstracker_static"
BUNDLE_NAME: Final = "ordnungstracker.js"
PANEL_URL_PATH: Final = "ordnungstracker"
PANEL_ELEMENT: Final = "ordnungstracker-panel"
VIEW_URL: Final = "/api/ordnungstracker/print/{view}"
SIGNED_URL_SECONDS: Final = 300

# Takte
EXTERNAL_CHECK_SECONDS: Final = 30
HOURLY_SECONDS: Final = 3600
SENSOR_ITEM_LIMIT: Final = 10

# Reparaturhinweise
ISSUE_INVALID_FILE: Final = "invalid_file"
ISSUE_NEWER_SCHEMA: Final = "newer_schema"
ISSUE_EXTERNAL_INVALID: Final = "external_invalid"
ISSUE_CONFLICT: Final = "conflict"
ISSUE_SAVE_FAILED: Final = "save_failed"
