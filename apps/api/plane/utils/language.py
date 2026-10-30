# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Keep these codes aligned with packages/i18n/src/constants/language.ts.
SUPPORTED_LANGUAGES = frozenset(
    {
        "en",
        "fr",
        "es",
        "ja",
        "zh-CN",
        "zh-TW",
        "ru",
        "it",
        "cs",
        "sk",
        "de",
        "ua",
        "pl",
        "ko",
        "pt-BR",
        "id",
        "ro",
        "vi-VN",
        "tr-TR",
        "ka-ge",
        "nl",
        "bg",
    }
)


def normalize_default_language(value):
    language = value.strip() if isinstance(value, str) else ""
    return language if language in SUPPORTED_LANGUAGES else "en"
