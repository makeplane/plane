/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type * as React from "react";

/**
 * Trigger guard for a menu trigger that sits inside a clickable ancestor (a card `Link`, a
 * collapsible header): keeps the click from reaching the ancestor or its default action.
 */
export const handleTriggerClick = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * Trigger guard for keyboard activation: a `Link` ancestor activates on Enter, so keep Enter and
 * Space on the trigger from bubbling out while the menu opens.
 */
export const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") e.stopPropagation();
};
