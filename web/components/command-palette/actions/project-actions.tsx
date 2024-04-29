import { Command } from "cmdk";
import { ContrastIcon, FileText } from "lucide-react";
import { DiceIcon, PhotoFilterIcon } from "@plane/ui";
// constants
import { E_COMMAND_PALETTE } from "@/constants/event-tracker";
// hooks
import { useCommandPalette, useEventTracker } from "@/hooks/store";
// ui

type Props = {
  closePalette: () => void;
};

export const CommandPaletteProjectActions: React.FC<Props> = (props) => {
  const { closePalette } = props;
  // store hooks
  const { toggleCreateCycleModal, toggleCreateModuleModal, toggleCreatePageModal, toggleCreateViewModal } =
    useCommandPalette();
  const { setTrackElement } = useEventTracker();

  return (
    <>
      <Command.Group heading="Cycle">
        <Command.Item
          onSelect={() => {
            closePalette();
            setTrackElement(E_COMMAND_PALETTE);
            toggleCreateCycleModal(true);
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <ContrastIcon className="h-3.5 w-3.5" />
            Create new cycle
          </div>
          <kbd>Q</kbd>
        </Command.Item>
      </Command.Group>
      <Command.Group heading="Module">
        <Command.Item
          onSelect={() => {
            closePalette();
            setTrackElement(E_COMMAND_PALETTE);
            toggleCreateModuleModal(true);
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <DiceIcon className="h-3.5 w-3.5" />
            Create new module
          </div>
          <kbd>M</kbd>
        </Command.Item>
      </Command.Group>
      <Command.Group heading="View">
        <Command.Item
          onSelect={() => {
            closePalette();
            setTrackElement(E_COMMAND_PALETTE);
            toggleCreateViewModal(true);
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <PhotoFilterIcon className="h-3.5 w-3.5" />
            Create new view
          </div>
          <kbd>V</kbd>
        </Command.Item>
      </Command.Group>
      <Command.Group heading="Page">
        <Command.Item
          onSelect={() => {
            closePalette();
            setTrackElement(E_COMMAND_PALETTE);
            toggleCreatePageModal(true);
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <FileText className="h-3.5 w-3.5" />
            Create new page
          </div>
          <kbd>D</kbd>
        </Command.Item>
      </Command.Group>
    </>
  );
};
