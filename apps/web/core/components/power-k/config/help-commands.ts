import { Rocket } from "lucide-react";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";

/**
 * Help commands - Help related commands
 * External links removed for self-hosted government deployment
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
      icon: Rocket,
      modifierShortcut: "cmd+/",
      action: () => toggleShortcutsListModal(true),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
