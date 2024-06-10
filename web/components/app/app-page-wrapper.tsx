"use client";

import { ReactNode } from "react";

export interface IAppPageWrapper {
  children: ReactNode;
}

export const AppPageWrapper = ({ children }: IAppPageWrapper) => (
  <div className="h-full w-full overflow-hidden">
    <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
  </div>
);
