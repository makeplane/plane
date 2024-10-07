"use client";
import React, { FC } from "react";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  icon: JSX.Element;
  title: string;
  disabled?: boolean;
};

export const IssueDetailWidgetButton: FC<Props> = (props) => {
  const { icon, title, disabled = false } = props;
  return (
    <div
      className={cn(
        "h-full w-min whitespace-nowrap flex items-center gap-2 border border-custom-border-200 rounded px-3 py-1.5",
        {
          "cursor-not-allowed text-custom-text-400 bg-custom-background-90": disabled,
          "cursor-pointer text-custom-text-300 hover:bg-custom-background-80": !disabled,
        }
      )}
    >
      {icon && icon}
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
};
