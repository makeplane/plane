"use client";
import React from "react";
import { observer } from "mobx-react";

export const WorkspaceContentWrapper = observer(({ children }: { children: React.ReactNode }) => (
  <div className="flex relative size-full overflow-hidden bg-custom-background-90 rounded-lg transition-all ease-in-out duration-300">
    <div className="size-full p-2 flex-grow transition-all ease-in-out duration-300 overflow-hidden">{children}</div>
  </div>
));
