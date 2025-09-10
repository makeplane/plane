"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { cn } from "@plane/utils";
import type { TPopoverMenuOptions } from "@/plane-web/components/marketplace";
// helpers

export const ApplicationTileMenuItem: FC<TPopoverMenuOptions> = observer((props) => {
  const { type, label = "", isActive, prependIcon, appendIcon, onClick, isDanger } = props;

  if (!isActive) {
    return <></>;
  }

  if (type === "menu-item")
    return (
      <div
        className={cn(
          "flex items-center gap-2 cursor-pointer mx-2 px-2 p-1 transition-all rounded-sm hover:bg-custom-background-80",
          isDanger ? " text-red-500" : " text-custom-text-200"
        )}
        onClick={() => onClick && onClick()}
      >
        {prependIcon && prependIcon}
        <div
          className={cn(
            "whitespace-nowrap text-sm text-custom-text-200",
            isDanger ? "text-red-500" : "text-custom-text-200"
          )}
        >
          {label}
        </div>
        {appendIcon && <div className="ml-auto">{appendIcon}</div>}
      </div>
    );

  return <div className="border-b border-custom-border-200" />;
});
