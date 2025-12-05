import { FileText, GithubIcon, MessageSquare, Rocket } from "lucide-react";
// plane imports
import { DiscordIcon } from "@plane/propel/icons";
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
    {
      id: "open_plane_documentation",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_plane_documentation",
      icon: FileText,
      action: () => {
        window.open("https://docs.plane.so/", "_blank", "noopener,noreferrer");
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
        window.open("https://discord.com/invite/A92xrEGCge", "_blank", "noopener,noreferrer");
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
        window.open("https://github.com/makeplane/plane/issues/new/choose", "_blank", "noopener,noreferrer");
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
      action: () => openChatSupport(),
      isEnabled: () => isChatSupportEnabled,
      isVisible: () => isChatSupportEnabled,
      closeOnSelect: true,
    },
  ];
};
