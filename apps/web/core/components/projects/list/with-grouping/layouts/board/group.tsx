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
import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// plane web imports
import type { TProjectsBoardLayoutStructure } from "@/types/workspace-project-filters";
// local imports
import { ProjectBoardGroupItem } from "./group-item";

type ProjectBoardGroup = {
  groupByProjectIds: TProjectsBoardLayoutStructure;
};

export const ProjectBoardGroup = observer(function ProjectBoardGroup(props: ProjectBoardGroup) {
  const { groupByProjectIds } = props;
  const [verticalAlign, setVerticalAlign] = useState<{ [key: string]: boolean }>({});

  return (
    <div className="w-full h-full overflow-hidden overflow-x-auto relative flex space-x-3 horizontal-scrollbar scrollbar-lg">
      {Object.entries(groupByProjectIds)?.map(([groupKey, projectIds]) => (
        <div
          key={groupKey}
          className={cn("py-3 h-full overflow-hidden flex-shrink-0", {
            "w-[320px]": !verticalAlign[groupKey],
          })}
        >
          <ProjectBoardGroupItem
            groupByKey={groupKey}
            projectIds={projectIds}
            verticalAlign={verticalAlign}
            setVerticalAlign={setVerticalAlign}
          />
        </div>
      ))}
    </div>
  );
});
