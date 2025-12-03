import React from "react";
// helpers
import { cn } from "@plane/utils";

type Props = {
  children: React.ReactNode;
  elementRef: React.RefObject<HTMLDivElement>;
  isMenuActive?: boolean;
};

export function FavoriteItemWrapper(props: Props) {
  const { children, elementRef, isMenuActive = false } = props;
  return (
    <>
      <div
        ref={elementRef}
        className={cn(
          "group/project-item cursor-pointer relative group flex items-center justify-between w-full gap-1.5 rounded-sm px-2 py-1 outline-none text-secondary hover:bg-surface-2 active:bg-surface-2",
          {
            "bg-surface-2": isMenuActive,
          }
        )}
      >
        {children}
      </div>
    </>
  );
}
