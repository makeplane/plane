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
          "group/project-item relative flex w-full items-center rounded-md px-2 py-1.5 text-primary hover:bg-layer-transparent-hover",
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
