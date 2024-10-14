"use client";

import { observer } from "mobx-react";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

export interface Props {
  parentRef: React.RefObject<HTMLElement>;
  MENU_ITEMS: TContextMenuItem[];
}

export const WorkspaceDraftIssueQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, MENU_ITEMS } = props;

  return (
    <>
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu
        ellipsis
        placement="bottom-end"
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        useCaptureForOutsideClick
        closeOnSelect
      >
        {MENU_ITEMS.map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.action();
            }}
            className={cn(
              "flex items-center gap-2",
              {
                "text-custom-text-400": item.disabled,
              },
              item.className
            )}
            disabled={item.disabled}
          >
            {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
            <div>
              <h5>{item.title}</h5>
              {item.description && (
                <p
                  className={cn("text-custom-text-300 whitespace-pre-line", {
                    "text-custom-text-400": item.disabled,
                  })}
                >
                  {item.description}
                </p>
              )}
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
