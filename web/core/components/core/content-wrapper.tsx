"use client";

import { ReactNode } from "react";

export interface ContentWrapperProps {
  children: ReactNode;
}

export const ContentWrapper = ({ children }: ContentWrapperProps) => (
  <div className="h-full w-full overflow-hidden">
    <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
  </div>
);
