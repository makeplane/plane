import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React, { useCallback } from "react";

const DropdownItem_ = ({
  children,
  onSelect,
  disabled,
  item,
}: {
  children: React.ReactNode;
  onSelect: (e: any, item: any) => void;
  disabled?: boolean;
  item?: any;
}) => {
  const handleSelect = useCallback(
    (e: any) => {
      onSelect(e, item);
    },
    [onSelect]
  );
  return (
    <RadixDropdownMenu.Item
      onSelect={handleSelect}
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

export const DropdownItem = React.memo(DropdownItem_);
