import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import React from "react";
import { DropdownItem } from "./DropdownItem";
import * as ScrollArea from "@radix-ui/react-scroll-area";

type Item<T> = T & {
  children?: Item<T>[];
  disabled?: boolean;
};

type DropdownItemsProps<T> = {
  items: Item<T>[];
  onSelect: (e: any, item: Item<T>) => void;
  renderItem: (item: Item<T>) => React.ReactNode;
  isItemDisabled?: (item: Item<T>) => boolean;
};

export const DropdownItems = <T,>({
  items,
  onSelect,
  renderItem,
  isItemDisabled,
}: DropdownItemsProps<T>) => {
  return (
    <>
      {items.map((item, index) => {
        if (item.children) {
          return (
            <RadixDropdownMenu.Sub key={index}>
              <RadixDropdownMenu.SubTrigger
                className="group relative flex h-[25px] select-none items-center rounded-[3px] pr-[5px] text-[13px] 
              leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 
              data-[highlighted]:data-[state=open]:bg-violet9 data-[state=open]:bg-violet4 data-[disabled]:text-mauve8 data-[highlighted]:data-[state=open]:text-violet1 data-[highlighted]:text-violet1 data-[state=open]:text-violet11"
              >
                {renderItem(item)}
              </RadixDropdownMenu.SubTrigger>
              <RadixDropdownMenu.Portal>
                <RadixDropdownMenu.SubContent
                  className="min-w-[220px] rounded-md bg-white p-[5px] 
                  shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] 
                  will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade 
                  data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade
                  "
                  sideOffset={2}
                  alignOffset={-5}
                >
                  <ScrollArea.Root className=" ">
                    <ScrollArea.Viewport className="h-full w-full max-h-[80vh]">
                      <DropdownItems
                        items={item.children}
                        onSelect={(e) => onSelect(e, item)}
                        renderItem={renderItem}
                        isItemDisabled={isItemDisabled}
                      />
                    </ScrollArea.Viewport>
                  </ScrollArea.Root>
                </RadixDropdownMenu.SubContent>
              </RadixDropdownMenu.Portal>
            </RadixDropdownMenu.Sub>
          );
        }
        return (
          <DropdownItem
            key={index}
            onSelect={(e) => onSelect(e, item)}
            disabled={isItemDisabled ? isItemDisabled(item) : item?.disabled}
          >
            {renderItem(item)}
          </DropdownItem>
        );
      })}
    </>
  );
};
