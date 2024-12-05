import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React, { createContext, useState } from "react";
import { DropdownContent } from "./DropdownContent";

type DropdownMenuProps = {
  children: React.ReactNode;
  items: any[];
  onSelect: (value: any) => void;
  renderItem: (item: any) => React.ReactNode;
  defaultOpen?: boolean;
};

export const DropdownMenuContext = createContext({
  items: [],
  onSelect: (value: any) => {},
  renderItem: (item: any) => <></>,
});

export const DropdownMenu = ({
  children,
  items,
  onSelect,
  renderItem,
  defaultOpen = false,
}: DropdownMenuProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const handleOpenChange = (open: boolean) => {
    setTimeout(() => {
      setOpen(open);
    }, 16);
  };

  return (
    <DropdownMenuContext.Provider
      value={{ items, onSelect, renderItem, setOpen }}
    >
      <RadixDropdownMenu.Root open={open} onOpenChange={handleOpenChange}>
        {children}

        <DropdownContent />
      </RadixDropdownMenu.Root>
    </DropdownMenuContext.Provider>
  );
};
