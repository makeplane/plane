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
        <h3 className="text-xl font-semibold">No worklogs yet</h3>
        <p className="text-sm">
          Issue types distinguish different kinds of work in unique ways, helping you to identify, categorize, and
          report on your team’s work more effectively.
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
