"use client";

import { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@plane/ui";

type Props = {
  toggleProjectGroupingFeature: () => void;
};
export const WorkspaceProjectStatesEmptyState: FC<Props> = ({ toggleProjectGroupingFeature }) => {
  const { resolvedTheme } = useTheme();

  // derived values
  const resolvedEmptyStatePath = `/projects/project-states-${resolvedTheme?.includes("dark") ? "dark" : "light"}.webp`;

  return (
    <div className="w-[600px] m-auto mt-12">
      <div className="flex flex-col gap-1.5 flex-shrink">
        <h3 className="text-xl font-medium">Enable project states</h3>
        <p className="text-sm">
          Project managers can now see the overall progress of all their projects from one screen. Turn on Project
          States below, set states for your projects, and start tracking progress.{" "}
        </p>
      </div>
      <Image
        src={resolvedEmptyStatePath}
        alt={"States empty state"}
        className="my-4"
        width={384}
        height={250}
        layout="responsive"
        lazyBoundary="100%"
      />
      <Button onClick={toggleProjectGroupingFeature} className="m-auto">
        Enable
      </Button>
    </div>
  );
};
