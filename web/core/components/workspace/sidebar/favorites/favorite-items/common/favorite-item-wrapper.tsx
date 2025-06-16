"use client";
import React, { FC } from "react";
// helpers
import { cn } from "@plane/utils";

type Props = {
  children: React.ReactNode;
  elementRef: React.RefObject<HTMLDivElement>;
  isMenuActive?: boolean;
};

export const FavoriteItemWrapper: FC<Props> = (props) => {
  const { children, elementRef, isMenuActive = false } = props;
  return (
    <>
      <div
        ref={elementRef}
        className={cn(
          "group/project-item cursor-pointer relative group flex items-center justify-between w-full gap-1.5 rounded px-2 py-1 outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 active:bg-custom-sidebar-background-90",
          {
            "bg-custom-sidebar-background-90": isMenuActive,
          }
        )}
      >
        {children}
      </div>
    </>
  );
};
