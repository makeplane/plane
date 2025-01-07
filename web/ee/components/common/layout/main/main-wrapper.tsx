"use client";

import React, { FC } from "react";
// utils
import { cn } from "@plane/utils";

type TMainWrapperProps = {
  children: React.ReactNode;
  isSidebarOpen: boolean;
};

export const MainWrapper: FC<TMainWrapperProps> = (props) => {
  const { children, isSidebarOpen } = props;
  return (
    <div
      className={cn(`flex flex-col h-full w-full overflow-y-auto px-10 py-8`, {
        "max-w-2/3": isSidebarOpen,
      })}
    >
      {children}
    </div>
  );
};
