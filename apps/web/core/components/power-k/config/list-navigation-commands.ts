/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CheckSquareOutline, ChevronDownOutline, ChevronUpOutline, FullScreenPeekOutline, SidePeekOutline } from "@makeplane/propel/icons";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useKeyboardNavStore } from "@/hooks/store/use-keyboard-nav-store";

/**
 * Work-item list navigation commands - drive the keyboard cursor across the
 * rendered work-item list (list / spreadsheet layouts) with linear-style
 * single-key bindings. The layouts own the cursor target callbacks, so every
 * command gates on the keyboard-nav store reporting an active layout.
 */
export const usePowerKListNavigationCommands = (): TPowerKCommandConfig[] => {
  // store
  const keyboardNav = useKeyboardNavStore();

  const move = (direction: "up" | "down") => {
    const focused = keyboardNav.moveCursor(direction);
    if (focused) keyboardNav.scrollFocusedEntity();
  };

  // `o` / Enter on a list with no cursor yet: place it on the first item, then open
  const openFocused = () => {
    if (!keyboardNav.getFocusedEntity()) {
      const focused = keyboardNav.moveCursor("down");
      if (focused) keyboardNav.scrollFocusedEntity();
    }
    keyboardNav.openFocusedEntity();
  };

  // same for multi-select so `x` never silently no-ops on a fresh list
  const toggleSelection = () => {
    if (!keyboardNav.getFocusedEntity()) {
      const focused = keyboardNav.moveCursor("down");
      if (focused) keyboardNav.scrollFocusedEntity();
    }
    keyboardNav.toggleFocusedSelection();
  };

  return [
    {
      id: "nav_work_item_down",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.move_down",
      icon: ChevronDownOutline,
      shortcut: "j",
      action: () => move("down"),
      isEnabled: () => keyboardNav.hasManagers(),
      isVisible: () => keyboardNav.hasOrderedEntities(),
      closeOnSelect: false,
    },
    {
      id: "nav_work_item_up",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.move_up",
      icon: ChevronUpOutline,
      shortcut: "k",
      action: () => move("up"),
      isEnabled: () => keyboardNav.hasManagers(),
      isVisible: () => keyboardNav.hasOrderedEntities(),
      closeOnSelect: false,
    },
    {
      id: "open_focused_work_item",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_work_item",
      icon: SidePeekOutline,
      shortcut: "enter",
      action: () => openFocused(),
      isEnabled: () => keyboardNav.hasManagers(),
      isVisible: () => keyboardNav.hasOrderedEntities(),
      closeOnSelect: false,
    },
    {
      id: "open_focused_work_item_full",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_work_item",
      icon: FullScreenPeekOutline,
      shortcut: "o",
      action: () => openFocused(),
      isEnabled: () => keyboardNav.hasManagers(),
      isVisible: () => keyboardNav.hasOrderedEntities(),
      closeOnSelect: false,
    },
    {
      id: "select_focused_work_item",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.toggle_selection",
      icon: CheckSquareOutline,
      shortcut: "x",
      action: () => toggleSelection(),
      isEnabled: () => keyboardNav.hasManagers(),
      isVisible: () => keyboardNav.hasOrderedEntities(),
      closeOnSelect: false,
    },
  ];
};
