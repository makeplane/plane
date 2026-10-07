/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Data-only entry for the emoji/icon picker. Re-exports just the lucide icon list, the
 * random-icon-name helper over it, and the emoji codepoint helper, so consumers that need
 * the data (not the picker UI) don't pull the `emoji-icon-picker` barrel's React picker
 * (base-ui), logo, and material-icon modules into their bundle graph.
 */

export { LUCIDE_ICONS_LIST } from "./lucide-icons";
export { getRandomIconName } from "./random-icon";
export { stringToEmoji } from "./helper";
