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
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
import { EPageStoreType } from "@/plane-web/hooks/store/use-page-store";

// lazy imports
const CycleCreateUpdateModal = lazy(() =>
  import("@/components/cycles/modal").then((module) => ({ default: module.CycleCreateUpdateModal }))
);
const CreateUpdateModuleModal = lazy(() =>
  import("@/components/modules").then((module) => ({ default: module.CreateUpdateModuleModal }))
);
const CreatePageModal = lazy(() =>
  import("@/components/pages/modals/create-page-modal").then((module) => ({ default: module.CreatePageModal }))
);
const CreateUpdateProjectViewModal = lazy(() =>
  import("@/components/views/modal").then((module) => ({ default: module.CreateUpdateProjectViewModal }))
);
const CreateUpdateAutomationModal = lazy(() =>
  import("@/components/automations/modals/create-update-modal").then((module) => ({
    default: module.CreateUpdateAutomationModal,
  }))
);
const BulkDeleteIssuesModal = lazy(() =>
  import("@/components/core/modals/bulk-delete-issues-modal").then((module) => ({
    default: module.BulkDeleteIssuesModal,
  }))
);

export type TProjectLevelModalsProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectLevelModals = observer(function ProjectLevelModals(props: TProjectLevelModalsProps) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const {
    isBulkDeleteIssueModalOpen,
    toggleBulkDeleteIssueModal,
    isCreateCycleModalOpen,
    toggleCreateCycleModal,
    isCreateModuleModalOpen,
    toggleCreateModuleModal,
    isCreateViewModalOpen,
    toggleCreateViewModal,
    createPageModal,
    toggleCreatePageModal,
  } = useCommandPalette();
  const {
    projectAutomations: { createUpdateModalConfig, setCreateUpdateModalConfig },
  } = useAutomations();

  return (
    <Suspense>
      <BulkDeleteIssuesModal
        isOpen={isBulkDeleteIssueModalOpen}
        onClose={() => toggleBulkDeleteIssueModal(false)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      />
      <CycleCreateUpdateModal
        isOpen={isCreateCycleModalOpen}
        handleClose={() => toggleCreateCycleModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />
      <CreateUpdateModuleModal
        isOpen={isCreateModuleModalOpen}
        onClose={() => toggleCreateModuleModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />
      <CreateUpdateProjectViewModal
        isOpen={isCreateViewModalOpen}
        onClose={() => toggleCreateViewModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />
      <CreatePageModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isModalOpen={createPageModal.isOpen}
        pageAccess={createPageModal.pageAccess}
        handleModalClose={() => toggleCreatePageModal({ isOpen: false })}
        redirectionEnabled
        storeType={EPageStoreType.PROJECT}
      />
      <CreateUpdateAutomationModal
        isOpen={createUpdateModalConfig.isOpen}
        data={createUpdateModalConfig.payload ?? undefined}
        onClose={() => setCreateUpdateModalConfig({ isOpen: false, payload: null })}
      />
    </Suspense>
  );
});
