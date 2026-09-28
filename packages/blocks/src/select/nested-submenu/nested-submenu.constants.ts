/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Hover intent before a flyout opens; once a sibling is open, switching is instant. */
export const NESTED_SUBMENU_OPEN_DELAY_MS = 100;

/**
 * Grace period after the pointer leaves a trigger/panel before the flyout closes — the window
 * for diagonal travel into nested content. One constant for every nesting level.
 */
export const NESTED_SUBMENU_CLOSE_DELAY_MS = 600;
