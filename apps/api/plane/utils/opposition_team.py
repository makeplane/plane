import json


def normalize_opposition_team(value):
    if value in (None, "", {}):
        return None

    if isinstance(value, str):
        trimmed_value = value.strip()
        if not trimmed_value:
            return None

        try:
            value = json.loads(trimmed_value)
        except json.JSONDecodeError:
            return {"name": trimmed_value, "logo": ""}

    if not isinstance(value, dict):
        raise ValueError("Opposition team must be an object with name and logo.")

    name = value.get("name")
    logo = value.get("logo", "")

    if not isinstance(name, str) or not name.strip():
        raise ValueError("Opposition team name is required.")

    if logo is None:
        logo = ""

    if not isinstance(logo, str):
        raise ValueError("Opposition team logo must be a string.")

    return {
        "name": name.strip(),
        "logo": logo.strip(),
    }
