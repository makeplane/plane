"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// plane web imports
import type { TProjectsBoardLayoutStructure } from "@/plane-web/types/workspace-project-filters";
// local imports
import { ProjectBoardGroupItem } from "./group-item";

type ProjectBoardGroup = {
  groupByProjectIds: TProjectsBoardLayoutStructure;
};

export const ProjectBoardGroup: FC<ProjectBoardGroup> = observer((props) => {
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
