import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React from "react";

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
      className="p-1 first:pt-0 last:border-b-0 last:pb-0 
      rounded
      hover:bg-bg-neutral-subtle
      focus:bg-bg-neutral-subtle
      focus:outline-none
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
