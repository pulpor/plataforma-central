import json
from pathlib import Path

from .models import SystemConfig

# systems/ lives at the repository root, one level above backend/
SYSTEMS_DIR = Path(__file__).resolve().parent.parent.parent / "systems"


def load_systems() -> dict[str, SystemConfig]:
    """Scan systems/*/config.json and build the registry.

    Folders starting with "_" (e.g. _template) are ignored. Each system is
    fully independent: adding a new one only requires a new folder with a
    config.json, no backend code changes or rebuilds.
    """
    systems: dict[str, SystemConfig] = {}
    if not SYSTEMS_DIR.exists():
        return systems

    for folder in sorted(SYSTEMS_DIR.iterdir()):
        if not folder.is_dir() or folder.name.startswith("_"):
            continue
        config_path = folder / "config.json"
        if not config_path.exists():
            continue
        try:
            data = json.loads(config_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        data["id"] = folder.name
        systems[folder.name] = SystemConfig(**data)

    return systems


def get_system_path(system_id: str) -> Path:
    return SYSTEMS_DIR / system_id
