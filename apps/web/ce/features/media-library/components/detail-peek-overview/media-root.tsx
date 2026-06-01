"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type TMediaLibraryPeekOverviewProps = {
  children: ReactNode;
};

export const MediaLibraryPeekOverview = ({ children }: TMediaLibraryPeekOverviewProps) => {
  const portalContainer = typeof document !== "undefined" ? document.getElementById("full-screen-portal") : null;

  const content = (
    <div className="w-full !text-base">
      <div
        className="absolute z-[25] flex flex-col overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 transition-all duration-300 top-0 bottom-0 right-0 w-full md:w-[50%] border-0 border-l"
        style={{
          boxShadow:
            "0px 4px 8px 0px rgba(0, 0, 0, 0.12), 0px 6px 12px 0px rgba(16, 24, 40, 0.12), 0px 1px 16px 0px rgba(16, 24, 40, 0.12)",
        }}
      >
        <div className="vertical-scrollbar scrollbar-md relative h-full w-full overflow-hidden overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return <>{portalContainer ? createPortal(content, portalContainer) : content}</>;
};
