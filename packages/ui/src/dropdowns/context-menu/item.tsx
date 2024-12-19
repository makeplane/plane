import React from "react";
// helpers
import { cn } from "../../../helpers";
// types
import { TContextMenuItem } from "./root";

type ContextMenuItemProps = {
  handleActiveItem: () => void;
  handleClose: () => void;
  isActive: boolean;
  item: TContextMenuItem;
};

export const ContextMenuItem: React.FC<ContextMenuItemProps> = (props) => {
  const { handleActiveItem, handleClose, isActive, item } = props;

  if (item.shouldRender === false) return null;

  return (
    <button
      type="button"
      className={cn(
        "w-full flex items-center gap-2 px-1 py-1.5 text-left text-custom-text-200 rounded text-xs select-none",
        {
          "bg-custom-background-90": isActive,
          "text-custom-text-400": item.disabled,
        },
        item.className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        item.action();
        if (item.closeOnClick !== false) handleClose();
      }}
      onMouseEnter={handleActiveItem}
      disabled={item.disabled}
    >
      {item.customContent ?? (
        <>
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
        </>
      )}
    </button>
  );
};
