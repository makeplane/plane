/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TLanguage = "en" | "ko" | "vi";

export interface ILanguageOption {
  label: string;
  value: TLanguage;
}
