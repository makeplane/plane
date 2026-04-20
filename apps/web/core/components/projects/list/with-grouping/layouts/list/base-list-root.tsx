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

import { useMemo } from "react";
import { observer } from "mobx-react";
// hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectLayouts } from "@/types/workspace-project-filters";
import { ProjectLayoutHOC } from "../project-layout-HOC";
import { List } from "./default";

type BaseListRootProps = {
  workspaceSlug: string;
};

export const BaseListRoot = observer(function BaseListRoot(props: BaseListRootProps) {
  const { workspaceSlug } = props;
  // store hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();
  // derived values
  const groupByProjectIds = getFilteredProjectsByLayout(EProjectLayouts.BOARD);
  const displayProperties = useMemo(
    () => ({
      key: true,
      state: true,
      labels: true,
      priority: true,
      due_date: true,
    }),
    []
  );

  return (
    <ProjectLayoutHOC layout={EProjectLayouts.TABLE} workspaceSlug={workspaceSlug}>
      <div className={`relative size-full bg-surface-1`}>
        <List
          displayProperties={displayProperties}
          groupBy={"state"}
          groupedProjectIds={groupByProjectIds ?? {}}
          showEmptyGroup
        />
      </div>
    </ProjectLayoutHOC>
  );
});
