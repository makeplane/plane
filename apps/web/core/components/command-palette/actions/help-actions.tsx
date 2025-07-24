"use client";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { FileText, GithubIcon, MessageSquare, Rocket } from "lucide-react";
// ui
import { DiscordIcon } from "@plane/ui";
// hooks
import { useCommandPalette, useTransient } from "@/hooks/store";

type Props = {
  closePalette: () => void;
};

export const CommandPaletteHelpActions: React.FC<Props> = observer((props) => {
  const { closePalette } = props;
  // hooks
  const { toggleShortcutModal } = useCommandPalette();
  const { toggleIntercom } = useTransient();

  return (
    <Command.Group heading="Help">
      <Command.Item
        onSelect={() => {
          closePalette();
          toggleShortcutModal(true);
        }}
        className="focus:outline-none"
      >
        <div className="flex items-center gap-2 text-custom-text-200">
          <Rocket className="h-3.5 w-3.5" />
          Open keyboard shortcuts
        </div>
      </Command.Item>
      <Command.Item
        onSelect={() => {
          closePalette();
          window.open("https://docs.plane.so/", "_blank");
        }}
        className="focus:outline-none"
      >
        <div className="flex items-center gap-2 text-custom-text-200">
          <FileText className="h-3.5 w-3.5" />
          Open Plane documentation
        </div>
      </Command.Item>
      <Command.Item
        onSelect={() => {
          closePalette();
          window.open("https://discord.com/invite/A92xrEGCge", "_blank");
        }}
        className="focus:outline-none"
      >
        <div className="flex items-center gap-2 text-custom-text-200">
          <DiscordIcon className="h-4 w-4" color="rgb(var(--color-text-200))" />
          Join our Discord
        </div>
      </Command.Item>
      <Command.Item
        onSelect={() => {
          closePalette();
          window.open("https://github.com/makeplane/plane/issues/new/choose", "_blank");
        }}
        className="focus:outline-none"
      >
        <div className="flex items-center gap-2 text-custom-text-200">
          <GithubIcon className="h-4 w-4" color="rgb(var(--color-text-200))" />
          Report a bug
        </div>
      </Command.Item>
      <Command.Item
        onSelect={() => {
          closePalette();
          toggleIntercom(true);
        }}
        className="focus:outline-none"
      >
        <div className="flex items-center gap-2 text-custom-text-200">
          <MessageSquare className="h-3.5 w-3.5" />
          Chat with us
        </div>
      </Command.Item>
    </Command.Group>
  );
});
