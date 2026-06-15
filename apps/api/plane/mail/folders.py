# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.mail.exceptions import MailFolderError


MAIL_FOLDER_LABELS = {
    "inbox": "Входящие",
    "starred": "Помеченные",
    "sent": "Отправленные",
    "drafts": "Черновики",
    "archive": "Архив",
    "spam": "Спам",
    "trash": "Корзина",
}

SPECIAL_USE_TO_KEY = {
    "\\inbox": "inbox",
    "\\sent": "sent",
    "\\drafts": "drafts",
    "\\junk": "spam",
    "\\trash": "trash",
    "\\archive": "archive",
}

KEY_TO_SPECIAL_USE = {
    "inbox": "\\Inbox",
    "sent": "\\Sent",
    "drafts": "\\Drafts",
    "spam": "\\Junk",
    "trash": "\\Trash",
    "archive": "\\Archive",
}

MOVABLE_DESTINATION_KEYS = {"inbox", "sent", "drafts", "archive", "spam", "trash"}
VIRTUAL_FOLDER_KEYS = {"starred"}


def _normalize_flag(flag):
    if isinstance(flag, bytes):
        flag = flag.decode("utf-8", errors="ignore")
    return str(flag)


def _folder_name(name):
    if isinstance(name, bytes):
        return name.decode("utf-8", errors="ignore")
    return str(name)


def _key_from_flags(name, flags):
    normalized_name = _folder_name(name)
    if normalized_name.upper() == "INBOX":
        return "inbox"

    for flag in flags or []:
        key = SPECIAL_USE_TO_KEY.get(_normalize_flag(flag).lower())
        if key:
            return key
    return None


def build_folder_map(list_folders_response):
    folder_map = {}

    for item in list_folders_response or []:
        if len(item) < 3:
            continue
        flags, delimiter, name = item
        key = _key_from_flags(name, flags)
        if not key:
            continue
        folder_map[key] = {
            "key": key,
            "name": _folder_name(name),
            "label": MAIL_FOLDER_LABELS.get(key, _folder_name(name)),
            "delimiter": _folder_name(delimiter) if delimiter else "/",
            "special_use": KEY_TO_SPECIAL_USE.get(key),
            "virtual": False,
        }

    folder_map.setdefault(
        "inbox",
        {
            "key": "inbox",
            "name": "INBOX",
            "label": MAIL_FOLDER_LABELS["inbox"],
            "delimiter": "/",
            "special_use": "\\Inbox",
            "virtual": False,
        },
    )

    folder_map["starred"] = {
        "key": "starred",
        "name": folder_map["inbox"]["name"],
        "label": MAIL_FOLDER_LABELS["starred"],
        "delimiter": folder_map["inbox"].get("delimiter", "/"),
        "special_use": "\\Flagged",
        "virtual": True,
    }

    return folder_map


def resolve_folder_name(folder_map, key):
    if key not in folder_map:
        raise MailFolderError(f"Unknown folder: {key}")
    return folder_map[key]["name"]


def validate_move_destination(folder_map, key):
    if key not in MOVABLE_DESTINATION_KEYS or key not in folder_map:
        raise MailFolderError(f"Folder cannot be used as move destination: {key}")
    return folder_map[key]["name"]
