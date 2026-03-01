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
import useSWR from "swr";
// ui
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web
import { SectionWrapper } from "@/components/common/layout/main/common/section-wrapper";
import { ProgressSection } from "@/components/common/layout/main/sections/progress-root";
import projectService from "@/services/project/project.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewProgressSectionRoot = observer(function ProjectOverviewProgressSectionRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  // derived values
  const project = getProjectById(projectId);

  const { data: analytics } = useSWR(
    project && workspaceSlug ? `PROJECT_ANALYTICS_${project?.id}` : null,
    project && workspaceSlug ? () => projectService.fetchProjectAnalytics(workspaceSlug, project?.id) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (!analytics) return null;

  const isEmpty = Object.values(analytics).every((value) => value === 0);

  if (isEmpty) {
    return (
      <SectionWrapper>
        <EmptyStateCompact
          assetKey="work-item"
          title={t("common_empty_state.progress.title")}
          description={t("common_empty_state.progress.description")}
        />
      </SectionWrapper>
    );
  }
  return <ProgressSection data={analytics} />;
});
