"use client";

import { FC, useState } from "react";
import { Search, X } from "lucide-react";
// components
import { Input, Dialog, EModalWidth } from "@plane/ui";
import { ShortcutCommandsList } from "@/components/command-palette";
// ui

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const ShortcutsModal: FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [query, setQuery] = useState("");

  const handleClose = () => {
    onClose();
    setQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XXL} className="flex flex-col space-y-4">
        <Dialog.Title className="flex justify-between">
          <span className="text-lg font-medium">Keyboard shortcuts</span>
          <button type="button" onClick={handleClose}>
            <X className="h-4 w-4 text-custom-text-200 hover:text-custom-text-100" aria-hidden="true" />
          </button>
        </Dialog.Title>
        <div className="flex w-full items-center rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-2">
          <Search className="h-3.5 w-3.5 text-custom-text-200" />
          <Input
            id="search"
            name="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for shortcuts"
            className="w-full border-none bg-transparent py-1 text-xs text-custom-text-200 outline-none"
            autoFocus
            tabIndex={1}
          />
        </div>
        <ShortcutCommandsList searchQuery={query} />
      </Dialog.Panel>
    </Dialog>
  );
};
