import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React, { createContext, useState } from "react";
import { DropdownContent } from "./components/DropdownContent";

// Types
type DropdownMenuProps<T> = {
  children: React.ReactNode;
  items?: T[];
  onSelect?: (e: React.MouseEvent, value: T) => void;
  renderItem?: (item: T) => React.ReactNode;
  defaultOpen?: boolean;
  onSearch?: (value: string) => void;
  isItemDisabled?: (item: T) => boolean;
};

type DropdownMenuContextType<T> = {
  items?: T[];
  onSelect?: (e: React.MouseEvent, value: T) => void;
  renderItem?: (item: T) => React.ReactNode;
  setOpen?: (open: boolean) => void;
  onSearch?: (value: string) => void;
  isItemDisabled?: (item: T) => boolean;
};

//@todo: Is it possible to not use any here?
export const DropdownMenuContext = createContext<DropdownMenuContextType<any>>({
  items: [],
  onSelect: (e, value) => {},
  renderItem: (item) => <></>,
});

export const DropdownMenu = <T,>({
  children,
  items,
  onSelect,
  renderItem,
  defaultOpen = false,
  onSearch,
  isItemDisabled,
}: DropdownMenuProps<T>) => {
  const [open, setOpen] = useState(defaultOpen);
  const handleOpenChange = (open: boolean) => {
    setTimeout(() => {
      setOpen(open);
    }, 16);
  };

  return (
    <DropdownMenuContext.Provider
      value={{ items, onSelect, renderItem, setOpen, onSearch, isItemDisabled }}
    >
      <RadixDropdownMenu.Root open={open} onOpenChange={handleOpenChange}>
        {children}
        {items && <DropdownContent />}
      </RadixDropdownMenu.Root>
    </DropdownMenuContext.Provider>
  );
};
