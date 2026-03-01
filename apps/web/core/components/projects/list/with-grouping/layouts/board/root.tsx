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
import { ContentWrapper } from "@plane/ui";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
// types
import { EProjectLayouts } from "@/types/workspace-project-filters";
// local imports
import { ProjectBoardGroup } from "./group";
import { ProjectLayoutHOC } from "../project-layout-HOC";

export const ProjectBoardLayout = observer(function ProjectBoardLayout() {
  // hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();

  const groupByProjectIds = getFilteredProjectsByLayout(EProjectLayouts.BOARD);

  return (
    <ProjectLayoutHOC layout={EProjectLayouts.BOARD}>
      <ContentWrapper className="!py-0">
        <ProjectBoardGroup groupByProjectIds={groupByProjectIds || {}} />
      </ContentWrapper>
    </ProjectLayoutHOC>
  );
});
