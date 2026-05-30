/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LifeBuoy, MessageSquare, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
import { useChatSupport } from "@/hooks/use-chat-support";

/**
 * Help commands - Help related commands
 */
export const usePowerKHelpCommands = (): TPowerKCommandConfig[] => {
  // store
  const { toggleShortcutsListModal } = usePowerK();
  const { isEnabled: isChatSupportEnabled, openChatSupport } = useChatSupport();
  const router = useRouter();

  return [
    {
      id: "open_help_center",
      type: "action",
      group: "help",
      i18n_title: "help_center.menu_label",
      icon: LifeBuoy,
      // Instance-global standalone reader — workspace-agnostic, visible to all users.
      action: () => router.push("/help"),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "open_keyboard_shortcuts",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_keyboard_shortcuts",
      icon: Rocket,
      modifierShortcut: "cmd+/",
      action: () => toggleShortcutsListModal(true),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "chat_with_us",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.chat_with_us",
      icon: MessageSquare,
      action: () => openChatSupport(),
      isEnabled: () => isChatSupportEnabled,
      isVisible: () => isChatSupportEnabled,
      closeOnSelect: true,
    },
  ];
};
