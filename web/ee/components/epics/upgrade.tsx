"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// ui
import { Button } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

export const EpicsUpgrade: FC = observer(() => {
  // store hooks
  const { resolvedTheme } = useTheme();
  return (
    <div className="pr-10">
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="w-full xl:max-w-[300px]">
            <div className="text-2xl font-semibold">Epics</div>
            <div className="text-sm">
              For larger bodies of work that span several cycles and can live across modules, create an epic. Link work
              items and sub-work items in a project to an epic and jump into an work item from the overview.
            </div>
            <div className="flex mt-6 gap-4 flex-wrap">
              <Button disabled>Coming Soon</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
