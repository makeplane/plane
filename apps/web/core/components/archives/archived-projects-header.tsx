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
// plane imports
import { EHeaderVariant, Header } from "@plane/ui";
// components
import { WorkspaceArchivesTabList } from "@/components/archives/workspace-archives-tab-list";
import HeaderFilters from "@/components/projects/header/without-grouping/filters";
import { ProjectSearch as ProjectBaseSearch } from "@/components/projects/header/without-grouping/search-projects";
import { ProjectSearch } from "@/components/projects/header/with-grouping/search-projects";
import { ProjectAttributesDropdown } from "@/components/projects/header/with-grouping/attributes-dropdown/root";
import { ProjectDisplayFiltersDropdown } from "@/components/projects/header/with-grouping/display-filters-dropdown/root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";

export const ArchivedProjectsHeader = observer(function ArchivedProjectsHeader(props: { workspaceSlug: string }) {
  const { workspaceSlug } = props;
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const isProjectGroupingFlagEnabled = useFlag(workspaceSlug, "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) && isProjectGroupingFlagEnabled;

  if (!workspaceSlug || !workspaceId) return null;

  return (
    <Header variant={EHeaderVariant.SECONDARY}>
      <Header.LeftItem>
        <WorkspaceArchivesTabList workspaceSlug={workspaceSlug} />
      </Header.LeftItem>
      <Header.RightItem className="flex items-center gap-2">
        {isProjectGroupingEnabled ? (
          <>
            <ProjectSearch />
            <ProjectAttributesDropdown workspaceSlug={workspaceSlug} workspaceId={workspaceId} isArchived />
            <ProjectDisplayFiltersDropdown workspaceSlug={workspaceSlug} isArchived />
          </>
        ) : (
          <>
            <ProjectBaseSearch />
            <HeaderFilters />
          </>
        )}
      </Header.RightItem>
    </Header>
  );
});
