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

/**
 * Matches characters that require the Noto Sans CJK font — Inter doesn't ship
 * these glyphs and they render as tofu otherwise. Covers Han (incl. supplementary
 * plane via /u), Hiragana, Katakana, Hangul (Syllables + Jamo), Bopomofo, plus
 * the auxiliary BMP ranges for CJK punctuation/symbols and halfwidth/fullwidth
 * forms which are Script=Common but only render correctly with a CJK font.
 *
 * Used by the PDF exporter (live) to decide whether to load the ~32MB font set
 * and by the client (web) to send an early hint.
 */
export const CJK_CHAR_REGEX =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303f\u31c0-\u31ef\uff00-\uffef]/u;
