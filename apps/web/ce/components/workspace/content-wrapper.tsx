import React from "react";
import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
import { AppRailRoot } from "@/components/navigation";
// plane web imports
import { TopNavigationRoot } from "../navigations";

export const WorkspaceContentWrapper = observer(function WorkspaceContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col relative size-full overflow-hidden bg-custom-background-90 rounded-lg transition-all ease-in-out duration-300">
      <TopNavigationRoot />
      <div className="relative flex size-full overflow-hidden">
        <AppRailRoot />
        <div
          className={cn(
            "relative size-full pb-2 pr-2 flex-grow transition-all ease-in-out duration-300 overflow-hidden"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
});
