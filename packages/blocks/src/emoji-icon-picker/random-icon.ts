/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LUCIDE_ICONS_LIST } from "./lucide-icons";

/**
 * A random icon name from {@link LUCIDE_ICONS_LIST} — the seed for a newly created entity's logo,
 * so a work item type or collection has a glyph before anyone picks one.
 *
 * It lived in the retired UI package, and its only input is the picker's own icon list,
 * so it belongs beside that list rather than in `@plane/utils` — which has no propel dependency and
 * should not grow one for a package slated for deletion. Import it from
 * `@plane/blocks/emoji-icon-picker/data`, the data-only entry, so a caller that just needs a name
 * does not pull the picker's React modules into its bundle.
 */
export const getRandomIconName = (): string =>
  LUCIDE_ICONS_LIST[Math.floor(Math.random() * LUCIDE_ICONS_LIST.length)].name;
