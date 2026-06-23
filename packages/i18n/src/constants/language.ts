/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLanguage, ILanguageOption } from "../types";

export const FALLBACK_LANGUAGE: TLanguage = "en";

export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
  { label: "English", value: "en" },
  { label: "Français", value: "fr" },
  { label: "Español", value: "es" },
  { label: "日本語", value: "ja" },
  { label: "简体中文", value: "zh-CN" },
  { label: "繁體中文", value: "zh-TW" },
  { label: "Русский", value: "ru" },
  { label: "Italian", value: "it" },
  { label: "Čeština", value: "cs" },
  { label: "Slovenčina", value: "sk" },
  { label: "Deutsch", value: "de" },
  { label: "Українська", value: "ua" },
  { label: "Polski", value: "pl" },
  { label: "한국어", value: "ko" },
  { label: "Português Brasil", value: "pt-BR" },
  { label: "Indonesian", value: "id" },
  { label: "Română", value: "ro" },
  { label: "Tiếng việt", value: "vi-VN" },
  { label: "Türkçe", value: "tr-TR" },
  { label: "فارسی", value: "fa" },
];

export const LANGUAGE_STORAGE_KEY = "userLanguage";

// Languages that render right-to-left. Used to set the document `dir` attribute
// so the entire UI layout (not just text) mirrors for these locales.
// When adding a new RTL locale (e.g. Arabic "ar", Hebrew "he", Urdu "ur"),
// register it in TLanguage + SUPPORTED_LANGUAGES first, then add it here.
export const RTL_LANGUAGES: TLanguage[] = ["fa"];

export const isRTLLanguage = (lng: TLanguage): boolean => RTL_LANGUAGES.includes(lng);

export const getLanguageDirection = (lng: TLanguage): "rtl" | "ltr" => (isRTLLanguage(lng) ? "rtl" : "ltr");
