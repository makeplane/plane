# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Texts of push notifications. The server builds them, so they do not go through the web i18n files: the
# language comes from the recipient's profile (Profile.language), Polish for "pl…", English otherwise.
# A notification carries only the work item identifier, its title, the project name and a count.


def polish_plural(count, one, few, many):
    """1 element / 2–4, 22–24… elementy / 5–21, 25… elementów."""
    if count == 1:
        return one
    if count % 10 in (2, 3, 4) and count % 100 not in (12, 13, 14):
        return few
    return many


def is_polish(language):
    return (language or "").lower().startswith("pl")


def single_title(identifier, sequence_id, project_name):
    return f"{identifier}-{sequence_id} · {project_name}"


def many_title(identifier, count, language):
    if is_polish(language):
        noun = polish_plural(count, "nowy element pracy", "nowe elementy pracy", "nowych elementów pracy")
        return f"{identifier}: {count} {noun}"
    return f"{identifier}: {count} new work items"


def test_message(language):
    if is_polish(language):
        return "Plane: powiadomienie testowe", "Powiadomienia push działają w tej przeglądarce."
    return "Plane: test notification", "Push notifications work in this browser."
