"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import type { TPopoverMenuOptions } from "@/components/workspace-notifications";
// helpers
import { cn } from "@/helpers/common.helper";

export const NotificationMenuOptionItem: FC<TPopoverMenuOptions> = observer((props) => {
  const { type, label = "", isActive, prependIcon, appendIcon, onClick } = props;

  if (type === "menu-item")
    return (
      <div
        className="flex items-center gap-2 cursor-pointer mx-2 px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
        onClick={() => onClick && onClick()}
      >
        {prependIcon && prependIcon}
        <div className={cn("whitespace-nowrap text-sm", isActive ? "text-custom-text-100" : "text-custom-text-200")}>
          {label}
        </div>
        {appendIcon && <div className="ml-auto">{appendIcon}</div>}
      </div>
    );

  return <div className="border-b border-custom-border-200" />;
});
