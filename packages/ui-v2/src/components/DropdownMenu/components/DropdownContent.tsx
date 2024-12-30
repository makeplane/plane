import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import * as ScrollArea from "@radix-ui/react-scroll-area";

import React, { useCallback, useContext, useEffect, useState } from "react";
import { DropdownMenuContext } from "../DropdownMenu";
import { DropdownItems } from "./DropdownItems";

export const DropdownContent = ({
  children,
  container,
}: {
  children?: React.ReactNode;
  container?: HTMLElement;
}) => {
  const { items, renderItem, onSelect, renderGroup, onSearch, isItemDisabled } =
    useContext(DropdownMenuContext);

  const [groupedItems, setGroupedItems] = useState<{
    [key: string]: any[];
  }>({});

  const [showSearchLoading, setShowSearchLoading] = useState(false);

  useEffect(() => {
    if (!items) return;
    let groupedItems: { [key: string]: any[] } = {};
    if (Array.isArray(items)) {
      groupedItems.default = items;
    } else {
      groupedItems = items;
    }

    setGroupedItems(groupedItems);
  }, [open, items]);

  const handleSearch = async (query: string) => {
    if (!onSearch) return;
    try {
      setShowSearchLoading(true);
      await onSearch(query);
    } catch (error) {
      console.error(error);
    } finally {
      setShowSearchLoading(false);
    }
  };

  const handleSelect = useCallback(
    (e: any, item: any) => {
      onSelect && onSelect(e, item);
    },
    [onSelect]
  );

  return (
    <RadixDropdownMenu.Portal container={container}>
      <RadixDropdownMenu.Content className="p-3 rounded-md bg-white border border-neutral">
        {onSearch && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full p-1 border border-neutral rounded-md mb-3 sticky top-0 bg-white z-10"
              onChange={(e) => handleSearch(e.target.value)}
            />
            {showSearchLoading && (
              <div role="status" className="absolute z-20 top-2 right-2">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            )}
          </div>
        )}
        <ScrollArea.Root className=" ">
          <ScrollArea.Viewport className="h-full w-full max-h-[80vh]">
            {children}

            {Object.keys(groupedItems).map((group) => (
              <RadixDropdownMenu.Group key={group}>
                {group !== "default" && (
                  <RadixDropdownMenu.Label>
                    {renderGroup ? renderGroup(group) : group}
                  </RadixDropdownMenu.Label>
                )}
                {renderItem && (
                  <DropdownItems
                    items={groupedItems[group]}
                    onSelect={handleSelect}
                    renderItem={renderItem}
                    isItemDisabled={isItemDisabled}
                  />
                )}
              </RadixDropdownMenu.Group>
            ))}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            className="flex touch-none select-none bg-blackA3 p-0.5 transition-colors duration-[160ms] ease-out hover:bg-blackA5 data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
            orientation="vertical"
          >
            <ScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-mauve10 before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            className="flex touch-none select-none bg-blackA3 p-0.5 transition-colors duration-[160ms] ease-out hover:bg-blackA5 data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
            orientation="horizontal"
          >
            <ScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-mauve10 before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-[44px] before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Corner className="bg-blackA5" />
        </ScrollArea.Root>
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Portal>
  );
};
