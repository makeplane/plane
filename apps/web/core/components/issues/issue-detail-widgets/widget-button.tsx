import type { FC } from "react";
import React from "react";
// helpers
import { cn } from "@plane/utils";

type Props = {
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
};

export function IssueDetailWidgetButton(props: Props) {
  const { icon, title, disabled = false } = props;
  return (
    <div
      className={cn(
        "h-full w-min whitespace-nowrap flex items-center gap-2 border border-subtle-1 rounded-sm px-3 py-1.5",
        {
          "cursor-not-allowed text-placeholder bg-surface-2": disabled,
          "cursor-pointer text-tertiary hover:bg-layer-1": !disabled,
        }
      )}
    >
      {icon && icon}
      <span className="text-13 font-medium">{title}</span>
    </div>
  );
}
