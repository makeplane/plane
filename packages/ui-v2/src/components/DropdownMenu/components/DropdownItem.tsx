import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React, { useContext } from "react";
import { DropdownMenuContext } from "../DropdownMenu";

export const DropdownItem = ({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: (e: any) => void;
}) => {
  return (
    <RadixDropdownMenu.Item
      onSelect={(e) => onSelect(e)}
      className="py-1 border-b border-border-subtle first:pt-0 last:border-b-0 last:pb-0"
    >
      {children}
    </RadixDropdownMenu.Item>
  );
};
