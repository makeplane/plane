"use client";
import React, { FC } from "react";
// helpers
import { cn } from "@/helpers/common.helper";

type TSidebarNavigation = {
  label: string | React.ReactNode;
  className?: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  indicatorElement?: React.ReactNode;
};

export const SidebarNavigation: FC<TSidebarNavigation> = (props) => {
  const { label, className, isActive, icon, indicatorElement } = props;
  return (
    <div
      className={cn(
        "cursor-pointer relative group w-full flex items-center justify-between gap-1.5 rounded px-2 py-1 outline-none",
        {
          "text-custom-primary-200 bg-custom-primary-100/10": isActive,
          "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 active:bg-custom-sidebar-background-90":
            !isActive,
        },
        className
      )}
    >
      <div className="flex items-center gap-1.5 py-[1px]">
        {icon && icon}
        {label}
      </div>
      {indicatorElement && indicatorElement}
    </div>
  );
};
