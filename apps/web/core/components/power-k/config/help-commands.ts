/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { DocumentationOutline, MessageSupportOutline, RocketOutline } from "@makeplane/propel/icons";
import { DOCUMENTATION_URL, FEEDBACK_URL } from "@plane/constants";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";

/**
 * Help commands - Help related commands
 */
export const usePowerKHelpCommands = (): TPowerKCommandConfig[] => {
  // store
  const { toggleShortcutsListModal } = usePowerK();

  return [
    {
      id: "open_keyboard_shortcuts",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_keyboard_shortcuts",
      icon: RocketOutline,
      modifierShortcut: "cmd+/",
      action: () => toggleShortcutsListModal(true),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "open_documentation",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_plane_documentation",
      icon: DocumentationOutline,
      action: () => {
        window.open(DOCUMENTATION_URL, "_blank", "noopener,noreferrer");
      },
      isEnabled: () => true,
      isVisible: () => Boolean(DOCUMENTATION_URL),
      closeOnSelect: true,
    },
    {
      id: "report_bug",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.report_bug",
      icon: MessageSupportOutline,
      action: () => {
        window.open(FEEDBACK_URL, "_blank", "noopener,noreferrer");
      },
      isEnabled: () => true,
      isVisible: () => Boolean(FEEDBACK_URL),
      closeOnSelect: true,
    },
  ];
};
