"use client";

import { Command } from "cmdk";
import { ContrastIcon, FileText, Layers } from "lucide-react";
// hooks
import {
  CYCLE_TRACKER_ELEMENTS,
  MODULE_TRACKER_ELEMENTS,
  PROJECT_PAGE_TRACKER_ELEMENTS,
  PROJECT_VIEW_TRACKER_ELEMENTS,
} from "@plane/constants";
import { DiceIcon } from "@plane/ui";
// hooks
import { useCommandPalette } from "@/hooks/store";
// ui

type Props = {
  closePalette: () => void;
};

export const CommandPaletteProjectActions: React.FC<Props> = (props) => {
  const { closePalette } = props;
  // store hooks
  const { toggleCreateCycleModal, toggleCreateModuleModal, toggleCreatePageModal, toggleCreateViewModal } =
    useCommandPalette();

  return (
    <>
      <Command.Group heading="Cycle">
        <Command.Item
          data-ph-element={CYCLE_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM}
          onSelect={() => {
            closePalette();
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
          data-ph-element={MODULE_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM}
          onSelect={() => {
            closePalette();
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
          data-ph-element={PROJECT_VIEW_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM}
          onSelect={() => {
            closePalette();
            toggleCreateViewModal(true);
          }}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <Layers className="h-3.5 w-3.5" />
            Create new view
          </div>
          <kbd>V</kbd>
        </Command.Item>
      </Command.Group>
      <Command.Group heading="Page">
        <Command.Item
          data-ph-element={PROJECT_PAGE_TRACKER_ELEMENTS.COMMAND_PALETTE_CREATE_BUTTON}
          onSelect={() => {
            closePalette();
            toggleCreatePageModal({ isOpen: true });
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
