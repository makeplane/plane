/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LUCIDE_ICONS_LIST } from "..";

/**
 * Returns a random icon name from the LUCIDE_ICONS_LIST array
 */
export const getRandomIconName = (): string =>
  LUCIDE_ICONS_LIST[Math.floor(Math.random() * LUCIDE_ICONS_LIST.length)].name;
