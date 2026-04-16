/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TLanguage, ILanguageOption } from "../types";

export const FALLBACK_LANGUAGE: TLanguage = "en";

export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
  { label: "English", englishLabel: "English", value: "en" },
  { label: "Français", englishLabel: "French", value: "fr" },
  { label: "Español", englishLabel: "Spanish", value: "es" },
  { label: "日本語", englishLabel: "Japanese", value: "ja" },
  { label: "简体中文", englishLabel: "Chinese (Simplified)", value: "zh-CN" },
  { label: "繁體中文", englishLabel: "Chinese (Traditional)", value: "zh-TW" },
  { label: "Русский", englishLabel: "Russian", value: "ru" },
  { label: "Italiano", englishLabel: "Italian", value: "it" },
  { label: "Čeština", englishLabel: "Czech", value: "cs" },
  { label: "Slovenčina", englishLabel: "Slovak", value: "sk" },
  { label: "Deutsch", englishLabel: "German", value: "de" },
  { label: "Українська", englishLabel: "Ukrainian", value: "ua" },
  { label: "Polski", englishLabel: "Polish", value: "pl" },
  { label: "한국어", englishLabel: "Korean", value: "ko" },
  { label: "Português Brasil", englishLabel: "Portuguese (Brazil)", value: "pt-BR" },
  { label: "Bahasa Indonesia", englishLabel: "Indonesian", value: "id" },
  { label: "Română", englishLabel: "Romanian", value: "ro" },
  { label: "Tiếng việt", englishLabel: "Vietnamese", value: "vi-VN" },
  { label: "Türkçe", englishLabel: "Turkish", value: "tr-TR" },
];

export const LANGUAGE_STORAGE_KEY = "userLanguage";
