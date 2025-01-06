"use client";

import React, { FC } from "react";
// utils
import { cn } from "@plane/utils";

type TSectionWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionWrapper: FC<TSectionWrapperProps> = (props) => {
  const { children, className = "" } = props;
  return (
    <div
      className={cn(
        `flex flex-col gap-4 w-full py-6 first:pt-0 border-b border-custom-border-200 last:border-0`,
        className
      )}
    >
      {children}
    </div>
  );
};
