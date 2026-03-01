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

import { observer } from "mobx-react";
// components
import { ProjectBoardListItem } from "@/components/projects/list/with-grouping/layouts/board/list-item";

type ProjectBoardList = { groupByKey: string; projectIds: string[] };

export const ProjectBoardList = observer(function ProjectBoardList(props: ProjectBoardList) {
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
