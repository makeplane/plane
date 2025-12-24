import { observer } from "mobx-react";
// components
import { cn } from "@plane/utils";
// local imports
import type { TPopoverMenuOptions } from "./root";

export const NotificationMenuOptionItem = observer(function NotificationMenuOptionItem(props: TPopoverMenuOptions) {
  const { type, label = "", isActive, prependIcon, appendIcon, onClick } = props;

  if (type === "menu-item")
    return (
      <div
        className="flex items-center gap-2 cursor-pointer mx-2 px-2 p-1 transition-all hover:bg-layer-1 rounded-xs"
        onClick={() => onClick && onClick()}
      >
        {prependIcon && prependIcon}
        <div
          className={cn("whitespace-nowrap text-body-xs-medium", {
            "text-primary": isActive,
            "text-secondary": !isActive,
          })}
        >
          {label}
        </div>
        {appendIcon && <div className="ml-auto">{appendIcon}</div>}
      </div>
    );

  return <div className="border-b border-subtle" />;
});
