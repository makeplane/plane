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

import { lazy, Suspense } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { EIssueServiceType } from "@plane/types";
import type { TIssue } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useDashboards } from "@/plane-web/hooks/store";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

// lazy imports
const CreateUpdateWorkItemModal = lazy(() =>
  import("@/components/issues/issue-modal/root").then((module) => ({ default: module.CreateUpdateIssueModal }))
);
const CreateProjectModal = lazy(() =>
  import("@/components/projects/modals/create-project-modal").then((module) => ({ default: module.CreateProjectModal }))
);
const CreateUpdateCustomerModal = lazy(() =>
  import("@/components/customers/customer-modal").then((module) => ({ default: module.CreateUpdateCustomerModal }))
);
const CreateUpdateWorkspaceDashboardModal = lazy(() =>
  import("@/components/dashboards/modals").then((module) => ({ default: module.CreateUpdateWorkspaceDashboardModal }))
);
const CreateUpdateInitiativeModal = lazy(() =>
  import("@/components/initiatives/components/create-update-initiatives-modal").then((module) => ({
    default: module.CreateUpdateInitiativeModal,
  }))
);
const CreateOrUpdateTeamspaceModal = lazy(() =>
  import("@/components/teamspaces/create-update/modal").then((module) => ({
    default: module.CreateOrUpdateTeamspaceModal,
  }))
);
const CreateUpdateTeamspaceViewModal = lazy(() =>
  import("@/components/teamspaces/views/modals/create-update").then((module) => ({
    default: module.CreateUpdateTeamspaceViewModal,
  }))
);

export type TWorkspaceLevelModalsProps = {
  workspaceSlug: string;
};

export const WorkspaceLevelModals = observer(function WorkspaceLevelModals(props: TWorkspaceLevelModalsProps) {
  const { workspaceSlug } = props;
  // router
  const { cycleId, moduleId, workItem: workItemIdentifier } = useParams();
  // store hooks
  const {
    isCreateIssueModalOpen,
    toggleCreateIssueModal,
    isCreateProjectModalOpen,
    toggleCreateProjectModal,
    createUpdateTeamspaceModal,
    toggleCreateTeamspaceModal,
    createUpdateTeamspaceViewModal,
    toggleCreateTeamspaceViewModal,
    createUpdateInitiativeModal,
    toggleCreateInitiativeModal,
    createUpdateCustomerModal,
    toggleCreateCustomerModal,
    createWorkItemAllowedProjectIds,
  } = useCommandPalette();
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  const { fetchSubIssues: fetchSubWorkItems } = useIssueDetail(EIssueServiceType.ISSUES);
  const { fetchSubIssues: fetchEpicSubWorkItems } = useIssueDetail(EIssueServiceType.EPICS);
  const {
    workspaceDashboards: {
      isCreateUpdateModalOpen: isWorkspaceDashboardModalOpen,
      createUpdateModalPayload: workspaceDashboardModalPayload,
      toggleCreateUpdateModal: toggleWorkspaceDashboardModal,
      updateCreateUpdateModalPayload: updateWorkspaceDashboardModalPayload,
    },
  } = useDashboards();
  // derived values
  const workItemId = workItemIdentifier ? getIssueIdByIdentifier(workItemIdentifier) : undefined;
  const workItemDetails = workItemId ? getIssueById(workItemId) : undefined;

  const handleWorkItemSubmit = async (newWorkItem: TIssue) => {
    if (!newWorkItem.project_id || !newWorkItem.id || newWorkItem.parent_id !== workItemDetails?.id) return;

    const fetchAction = workItemDetails?.is_epic ? fetchEpicSubWorkItems : fetchSubWorkItems;
    await fetchAction(workspaceSlug, newWorkItem.project_id, workItemDetails.id);
  };

  const getCreateIssueModalData = () => {
    if (cycleId) return { cycle_id: cycleId };
    if (moduleId) return { module_ids: [moduleId] };
    return undefined;
  };

  return (
    <Suspense>
      <CreateUpdateWorkItemModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => toggleCreateIssueModal(false)}
        data={getCreateIssueModalData()}
        onSubmit={handleWorkItemSubmit}
        allowedProjectIds={createWorkItemAllowedProjectIds}
      />
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => toggleCreateProjectModal(false)}
        workspaceSlug={workspaceSlug}
      />
      <CreateOrUpdateTeamspaceModal
        teamspaceId={createUpdateTeamspaceModal.teamspaceId}
        isModalOpen={createUpdateTeamspaceModal.isOpen}
        handleModalClose={() => toggleCreateTeamspaceModal({ isOpen: false, teamspaceId: undefined })}
      />
      {createUpdateTeamspaceViewModal.teamspaceId && (
        <CreateUpdateTeamspaceViewModal
          isOpen={createUpdateTeamspaceViewModal.isOpen}
          onClose={() => toggleCreateTeamspaceViewModal({ isOpen: false, teamspaceId: undefined })}
          workspaceSlug={workspaceSlug}
          teamspaceId={createUpdateTeamspaceViewModal.teamspaceId}
        />
      )}
      <CreateUpdateInitiativeModal
        isOpen={createUpdateInitiativeModal.isOpen}
        handleClose={() => toggleCreateInitiativeModal({ isOpen: false, initiativeId: undefined })}
      />
      <CreateUpdateWorkspaceDashboardModal
        data={workspaceDashboardModalPayload ?? undefined}
        isOpen={isWorkspaceDashboardModalOpen}
        onClose={() => {
          toggleWorkspaceDashboardModal(false);
          setTimeout(() => {
            updateWorkspaceDashboardModalPayload(null);
          }, 300);
        }}
      />
      <CreateUpdateCustomerModal
        isOpen={createUpdateCustomerModal.isOpen}
        customerId={createUpdateCustomerModal.customerId}
        onClose={() => toggleCreateCustomerModal({ isOpen: false, customerId: undefined })}
      />
    </Suspense>
  );
});
