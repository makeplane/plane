/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useTheme } from "next-themes";
import { Button } from "@plane/propel/button";

type Props = {
  toggleProjectGroupingFeature: () => void;
};
export function WorkspaceProjectStatesEmptyState({ toggleProjectGroupingFeature }: Props) {
  const { resolvedTheme } = useTheme();

  // derived values
  const resolvedEmptyStatePath = `/projects/project-states-${resolvedTheme?.includes("dark") ? "dark" : "light"}.webp`;

  return (
    <div className="w-[600px] m-auto mt-12">
      <div className="flex flex-col gap-1.5 flex-shrink">
        <h3 className="text-18 font-medium">Enable project states</h3>
        <p className="text-13">
          Project managers can now see the overall progress of all their projects from one screen. Turn on Project
          States below, set states for your projects, and start tracking progress.{" "}
        </p>
      </div>
      <img
        src={resolvedEmptyStatePath}
        alt={"States empty state"}
        width={384}
        height={250}
        className="my-4 w-full h-full object-cover"
      />
      <Button onClick={toggleProjectGroupingFeature} className="m-auto">
        Enable
      </Button>
    </div>
  );
}
