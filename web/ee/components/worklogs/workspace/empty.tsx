"use client";

import { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export const WorklogEmptyScreen: FC = () => {
  const { resolvedTheme } = useTheme();

  // derived values
  const resolvedEmptyStatePath = `/empty-state/worklogs/worklog-${resolvedTheme === "light" ? "light" : "dark"}.png`;

  return (
    <div className="w-[600px] m-auto mt-12">
      <div className="flex flex-col gap-1.5 flex-shrink">
        <h3 className="text-xl font-semibold">See timesheets for any member in any project.</h3>
        <p className="text-sm">
          When you log time via Tracked time in work item properties, you will see detailed timesheets here. Any member
          can log time in any work item in any project in your workspace.
        </p>
      </div>
      <Image
        src={resolvedEmptyStatePath}
        alt={"Worklog empty state"}
        width={384}
        height={250}
        layout="responsive"
        lazyBoundary="100%"
      />
    </div>
  );
};
