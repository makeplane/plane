"use client";

import { useMemo } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { FileText, GithubIcon, MessageSquare, Rocket } from "lucide-react";
// plane ui
import { DiscordIcon } from "@plane/ui";
// hooks
import { useCommandPalette, useTransient } from "@/hooks/store";
// local components
import { PowerKCommandItem } from "./command-item";

type Props = {
  handleClose: () => void;
};

export const PowerKHelpMenu: React.FC<Props> = observer((props) => {
  const { handleClose } = props;
  // store hooks
  const { toggleShortcutModal } = useCommandPalette();
  const { toggleIntercom } = useTransient();

  const HELP_MENU_OPTIONS = useMemo(
    () => [
      {
        key: "keyboard-shortcuts",
        label: "Open keyboard shortcuts",
        icon: Rocket,
        onClick: () => toggleShortcutModal(true),
      },
      {
        key: "documentation",
        label: "Open Plane documentation",
        icon: FileText,
        onClick: () => window.open("https://docs.plane.so/", "_blank"),
      },
      {
        key: "discord",
        label: "Join our Discord",
        icon: DiscordIcon,
        onClick: () => window.open("https://discord.com/invite/A92xrEGCge", "_blank"),
      },
      {
        key: "report-bug",
        label: "Report a bug",
        icon: GithubIcon,
        onClick: () => window.open("https://github.com/makeplane/plane/issues/new/choose", "_blank"),
      },
      {
        key: "chat",
        label: "Chat with us",
        icon: MessageSquare,
        onClick: () => toggleIntercom(true),
      },
    ],
    [toggleIntercom, toggleShortcutModal]
  );

  return (
    <Command.Group heading="Help">
      {HELP_MENU_OPTIONS.map((option) => (
        <PowerKCommandItem
          key={option.key}
          icon={option.icon}
          label={option.label}
          onSelect={() => {
            option.onClick();
            handleClose();
          }}
        />
      ))}
    </Command.Group>
  );
});
