import { Command } from "cmdk";
import { FileText, GithubIcon, MessageSquare, Rocket } from "lucide-react";
// hooks
import { useApplication } from "hooks/store";
// ui
import { DiscordIcon } from "@plane/ui";

type Props = {
  closePalette: () => void;
};

export const CommandPaletteHelpActions: React.FC<Props> = (props) => {
  const { closePalette } = props;

  const {
    commandPalette: { toggleShortcutModal },
  } = useApplication();

  return (
    <Command.Group heading="Help">
      <Command.Item
        onSelect={() => {
          closePalette();
          toggleShortcutModal(true);
        }}
        className="focus:outline-none"
      >
        <div className="flex items-center gap-2 text-neutral-text-medium">
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
        <div className="flex items-center gap-2 text-neutral-text-medium">
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
        <div className="flex items-center gap-2 text-neutral-text-medium">
          <DiscordIcon className="h-4 w-4" color="var(--color-neutral-110)" />
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
        <div className="flex items-center gap-2 text-neutral-text-medium">
          <GithubIcon className="h-4 w-4" color="var(--color-neutral-110)" />
          Report a bug
        </div>
      </Command.Item>
      <Command.Item
        onSelect={() => {
          closePalette();
          (window as any)?.$crisp.push(["do", "chat:open"]);
        }}
        className="focus:outline-none"
      >
        <div className="flex items-center gap-2 text-neutral-text-medium">
          <MessageSquare className="h-3.5 w-3.5" />
          Chat with us
        </div>
      </Command.Item>
    </Command.Group>
  );
};
