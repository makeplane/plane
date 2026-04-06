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
import useSWR from "swr";
import { observer } from "mobx-react";
import { WorkFlowListHeader } from "./header/root";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { useTranslation } from "@plane/i18n";
import { useEffect, useState } from "react";
import { CreateUpdateWorkflowModal } from "./create-update-workflow-modal";
import { WorkFlowCard } from "./workflow-card/root";
import { Loader } from "@plane/ui";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const WorkflowsListRoot = observer(function WorkflowsListRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  // states
  const [createWorkflowModal, setCreateWorkflowModal] = useState<boolean>(false);
  // hooks
  const { t } = useTranslation();
  const {
    getFilteredProjectWorkflows,
    isMultipleWorkflowModeEnabled,
    fetchProjectWorkflows,
    loader,
    filters: { searchQuery, isFiltersChanged, reset: resetFilters, isSortChanged },
  } = useWorkflows();

  // derived values
  const projectWorkflows = getFilteredProjectWorkflows(projectId);
  const isMultipleModeEnabled = isMultipleWorkflowModeEnabled(workspaceSlug, projectId);

  useEffect(() => {
    if (!isMultipleModeEnabled && (searchQuery.length > 0 || isFiltersChanged || isSortChanged)) {
      resetFilters();
    }
  }, [isMultipleModeEnabled, searchQuery.length, isFiltersChanged, isSortChanged, resetFilters]);

  // Fetch project workflows list
  useSWR(`PROJECT_WORKFLOWS_${workspaceSlug}_${projectId}`, () => fetchProjectWorkflows(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  return (
    <>
      <div>
        <WorkFlowListHeader
          handleCreateWorkflow={() => setCreateWorkflowModal(true)}
          showControls={isMultipleModeEnabled}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
        <div className="mt-4">
          {projectWorkflows.length > 0 ? (
            <div className="flex flex-col gap-4">
              {projectWorkflows.map((workflow) => (
                <WorkFlowCard
                  key={workflow.id}
                  workflow={workflow}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                />
              ))}
            </div>
          ) : loader ? (
            <Loader className="flex flex-col gap-4">
              <Loader.Item height="80px" width="100%" />
              <Loader.Item height="80px" width="100%" />
              <Loader.Item height="80px" width="100%" />
            </Loader>
          ) : searchQuery.length > 0 || isFiltersChanged ? (
            <EmptyStateCompact
              assetKey="workflow"
              title="No matching results"
              description={isFiltersChanged ? "Try clearing your filters" : "Try adjusting your search terms"}
              actions={
                isFiltersChanged
                  ? [
                      {
                        label: "Reset filters",
                        onClick: () => resetFilters(),
                        variant: "secondary",
                      },
                    ]
                  : undefined
              }
              align="start"
              rootClassName="py-20"
            />
          ) : (
            <EmptyStateCompact
              assetKey="workflow"
              title={t("settings_empty_state.workflows.title")}
              description={t("settings_empty_state.workflows.description")}
              actions={
                isMultipleModeEnabled
                  ? [
                      {
                        label: t("settings_empty_state.workflows.cta_primary"),
                        onClick: () => setCreateWorkflowModal(true),
                      },
                    ]
                  : undefined
              }
              align="start"
              rootClassName="py-20"
            />
          )}
        </div>
      </div>
      {/* Modals */}
      <CreateUpdateWorkflowModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={createWorkflowModal}
        onClose={() => setCreateWorkflowModal(false)}
      />
    </>
  );
});
