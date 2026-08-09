/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { GANTT_TIMELINE_TYPE } from "@plane/types";
import type { IProject } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { GanttChartRoot, ProjectGanttSidebar } from "@/components/gantt-chart";
import { TimeLineTypeContext } from "@/components/gantt-chart/contexts";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import { ProjectGanttBlock } from "./block";

const PROJECT_ANALYTICS_FIELDS = "total_issues,completed_issues,start_date,target_date";

export const ProgramTimelineRoot = observer(function ProgramTimelineRoot() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceProjectIds, fetchProjects, fetchProjectAnalyticsCount } = useProject();

  // fetch the workspace's projects (no-op if already loaded elsewhere)
  useSWR(
    workspaceSlug ? ["programTimelineProjects", workspaceSlug] : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug.toString()) : null,
    { revalidateOnFocus: false }
  );
  const { isLoading: isAnalyticsLoading } = useSWR(
    workspaceSlug ? ["programTimelineAnalytics", workspaceSlug] : null,
    workspaceSlug
      ? () => fetchProjectAnalyticsCount(workspaceSlug.toString(), { fields: PROJECT_ANALYTICS_FIELDS })
      : null,
    { revalidateOnFocus: false }
  );

  if (workspaceProjectIds === undefined || isAnalyticsLoading) {
    return (
      <Loader className="space-y-3 p-4">
        <Loader.Item height="34px" />
        <Loader.Item height="34px" />
        <Loader.Item height="34px" />
        <Loader.Item height="34px" />
      </Loader>
    );
  }

  if (workspaceProjectIds.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <SimpleEmptyState
          title={t("program_timeline")}
          description="Create a project to see it show up on the program timeline."
          size="lg"
        />
      </div>
    );
  }

  return (
    <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.PROJECT}>
      <GanttChartRoot
        title="Projects"
        loaderTitle="Projects"
        blockIds={workspaceProjectIds}
        sidebarToRender={(props) => <ProjectGanttSidebar {...props} />}
        blockToRender={(data: IProject) => <ProjectGanttBlock projectId={data.id} />}
        blockUpdateHandler={() => {}}
        enableBlockLeftResize={false}
        enableBlockRightResize={false}
        enableBlockMove={false}
        enableReorder={false}
        enableAddBlock={false}
        showAllBlocks
      />
    </TimeLineTypeContext.Provider>
  );
});
