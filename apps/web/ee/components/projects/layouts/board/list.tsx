"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { ProjectBoardListItem } from "@/plane-web/components/projects/layouts/board/list-item";

type ProjectBoardList = { groupByKey: string; projectIds: string[] };

export const ProjectBoardList: FC<ProjectBoardList> = observer((props) => {
  const { groupByKey, projectIds } = props;

  return (
    <div className="max-h-full overflow-hidden overflow-y-auto flex flex-col gap-y-2 mt-2">
      {projectIds.map((projectId) => (
        <div key={`${groupByKey}-${projectId}`}>
          <ProjectBoardListItem groupByKey={groupByKey} projectId={projectId} />
        </div>
      ))}
    </div>
  );
});
