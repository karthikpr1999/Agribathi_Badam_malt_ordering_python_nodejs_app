import json
import os

# Both config files sit one level up in config/
_BASE = os.path.join(os.path.dirname(__file__), "..", "config")


def load_prices() -> dict:
    """Read prices.json on every call so edits take effect immediately."""
    path = os.path.join(_BASE, "prices.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Strip the _comment key if present
    return {k: float(v) for k, v in data.items() if not k.startswith("_")}


def save_prices(prices: dict) -> None:
    """Write prices.json (preserves comment key if present)."""
    path = os.path.join(_BASE, "prices.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            existing = json.load(f)
    except Exception:
        existing = {}
    comment = existing.get("_comment", "Edit prices here. No server restart needed.")
    output = {"_comment": comment}
    output.update({k: float(v) for k, v in prices.items()})
    with open(path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)


def load_db_config() -> dict:
    path = os.path.join(_BASE, "db_config.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
