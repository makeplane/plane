import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React, { useContext } from "react";
import { DropdownMenuContext } from "./DropdownMenu";

export const DropdownContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { items, renderItem } = useContext(DropdownMenuContext);
  return (
    <RadixDropdownMenu.Portal
      container={document.getElementById("portal-root")}
    >
      <RadixDropdownMenu.Content className="px-5 rounded-md bg-white border border-border-neutral">
        {items.map((item, index) => (
          <RadixDropdownMenu.Item key={index}>
            {renderItem(item)}
          </RadixDropdownMenu.Item>
        ))}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Portal>
  );
};
