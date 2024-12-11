import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React, { useContext } from "react";
import { DropdownMenuContext } from "../DropdownMenu";

export const DropdownItem = ({
  children,
  onSelect,
  disabled,
}: {
  children: React.ReactNode;
  onSelect: (e: any) => void;
  disabled?: boolean;
}) => {
  return (
    <RadixDropdownMenu.Item
      onSelect={(e) => onSelect(e)}
      className="py-1 border-b border-border-subtle first:pt-0 last:border-b-0 last:pb-0 
      hover:bg-bg-neutral-subtle
      // focus:outline-none
      active:bg-bg-neutral-emphasis
      cursor-pointer

      data-[disabled]:pointer-events-none
      data-[disabled]:opacity-50
      data-[disabled]:cursor-not-allowed
       "
      disabled={disabled}
    >
      {children}
    </RadixDropdownMenu.Item>
  );
};
