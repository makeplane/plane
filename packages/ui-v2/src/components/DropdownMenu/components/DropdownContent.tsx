import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React, { useContext, useState, useEffect } from "react";
import { DropdownMenuContext } from "../DropdownMenu";
import { DropdownItem } from "./DropdownItem";

export const DropdownContent = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const { items, renderItem, onSelect } = useContext(DropdownMenuContext);

  const [groupedItems, setGroupedItems] = useState<{
    [key: string]: any[];
  }>({});

  useEffect(() => {
    let groupedItems: { [key: string]: any[] } = {};
    if (Array.isArray(items)) {
      groupedItems.default = items;
    } else {
      groupedItems = items;
    }

    setGroupedItems(groupedItems);
  }, [open]);

  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content className="p-3 rounded-md bg-white border border-border-neutral">
        {children}
        {items &&
          items.map((item, index) => (
            <DropdownItem key={index} onSelect={(e) => onSelect(e, item)}>
              {renderItem(item)}
            </DropdownItem>
          ))}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Portal>
  );
};
