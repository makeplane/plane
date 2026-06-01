/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { THelpLocale } from "@plane/types";

// Content is multilingual (VI/EN/KO); the admin chrome stays English-only.
export const HELP_LOCALES: { value: THelpLocale; label: string }[] = [
  { value: "vi", label: "Vietnamese" },
  { value: "en", label: "English" },
  { value: "ko", label: "Korean" },
];
