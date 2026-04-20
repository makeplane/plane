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

import { CJK_CHAR_REGEX } from "@plane/constants";

export const INTER_FONT_FAMILY = "Inter";
// Loaded lazily by ensureCjkFontsRegistered when a doc actually contains CJK text.
export const CJK_FONT_FAMILY = "Noto Sans CJK";

/**
 * Returns an override style for text runs that need the CJK font. Non-CJK runs
 * return `{}` so the page-level default (Inter) cascades through unchanged —
 * avoids loading the heavy ~32MB Noto Sans CJK set when it isn't needed.
 */
export const getFontStyle = (text: string | undefined): Record<string, string> => {
  if (!text) return {};
  if (CJK_CHAR_REGEX.test(text)) return { fontFamily: CJK_FONT_FAMILY };
  return {};
};
