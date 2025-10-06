import { FileText, GithubIcon, MessageSquare, Rocket } from "lucide-react";
// plane imports
import { DiscordIcon } from "@plane/propel/icons";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useTransient } from "@/hooks/store/use-transient";

/**
 * Help commands - Help related commands
 */
export const usePowerKHelpCommands = (): TPowerKCommandConfig[] => {
  // store
  const { toggleShortcutModal } = useCommandPalette();
  const { toggleIntercom } = useTransient();

  return [
    {
      id: "open_keyboard_shortcuts",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_keyboard_shortcuts",
      icon: Rocket,
      action: () => toggleShortcutModal(true),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "open_plane_documentation",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_plane_documentation",
      icon: FileText,
      action: () => {
        window.open("https://docs.plane.so/", "_blank");
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "join_discord",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.join_discord",
      icon: DiscordIcon,
      action: () => {
        window.open("https://discord.com/invite/A92xrEGCge", "_blank");
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "report_bug",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.report_bug",
      icon: GithubIcon,
      action: () => {
        window.open("https://github.com/makeplane/plane/issues/new/choose", "_blank");
      },
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
      action: () => toggleIntercom(true),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
