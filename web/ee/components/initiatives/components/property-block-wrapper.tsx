"use client";

import React, { FC } from "react";
// plane imports
import { cn } from "@plane/utils";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export const PropertyBlockWrapper: FC<Props> = (props) => {
  const { className = "", children } = props;
  return (
    <div className="h-5">
      <div
        className={cn(
          "h-full text-xs px-2 flex items-center gap-2 text-custom-text-200 border-[0.5px] border-custom-border-300 rounded",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
