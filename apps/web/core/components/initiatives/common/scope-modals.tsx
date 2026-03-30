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
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// hooks
import { ProjectMultiSelectModal } from "@/components/projects/modals/multi-select-modal";
import { useProject } from "@/hooks/store/use-project";
// plane web hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { WorkspaceEpicsListModal } from "../details/main/collapsible-section/epics/workspace-epic-modal";

type TInitiativeScopeModals = {
  workspaceSlug: string;
  initiativeId: string;
};

export const InitiativeScopeModals = observer(function InitiativeScopeModals(props: TInitiativeScopeModals) {
  const { workspaceSlug, initiativeId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    initiative: { isProjectsModalOpen, isEpicModalOpen, toggleProjectsModal, toggleEpicModal },
  } = useInitiatives();
  const {
    initiative: {
      scope: {
        epics: { addEpicsToInitiative, getInitiativeEpicsDetailById },
        projects: { fetchInitiativeProjects },
      },
      fetchInitiativeAnalytics,
      updateInitiative,
      getInitiativeById,
    },
  } = useInitiatives();
  const { joinedProjectIds } = useProject();
  // derived values
  const initiative = getInitiativeById(initiativeId);

  const initiativeEpics =
    (initiative?.epic_ids != null && initiative.epic_ids.length > 0
      ? initiative.epic_ids
      : getInitiativeEpicsDetailById(initiativeId)) ?? [];

  // handlers
  const handleAddEpicToInitiative = async (epicIds: string[]) => {
    try {
      await addEpicsToInitiative(workspaceSlug, initiativeId, epicIds);
      setToast({
        title: t("toast.success"),
        type: TOAST_TYPE.SUCCESS,
        message: t("initiatives.toast.epic_update_success", { count: epicIds.length }),
      });
    } catch {
      setToast({
        title: t("toast.success"),
        type: TOAST_TYPE.ERROR,
        message: t("initiatives.toast.epic_update_error"),
      });
    }
  };

  const handleProjectsUpdate = async (initiativeProjectIds: string[]) => {
    if (!initiativeId) return;

    await updateInitiative(workspaceSlug, initiativeId, { project_ids: initiativeProjectIds })
      .then(async () => {
        fetchInitiativeProjects(workspaceSlug, initiativeId);
        fetchInitiativeAnalytics(workspaceSlug, initiativeId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("initiatives.toast.project_update_success"),
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.success"),
          message: error?.error ?? t("initiatives.toast.project_update_error"),
        });
      });
  };

  const epicModal = isEpicModalOpen ? (
    <WorkspaceEpicsListModal
      workspaceSlug={workspaceSlug}
      isOpen
      searchParams={{}}
      selectedEpicIds={initiativeEpics ?? []}
      handleClose={() => void toggleEpicModal(false)}
      handleOnSubmit={async (data) => {
        await handleAddEpicToInitiative(data.map((epic) => epic.id));
      }}
    />
  ) : null;

  return (
    <>
      <ProjectMultiSelectModal
        isOpen={isProjectsModalOpen}
        onClose={() => toggleProjectsModal(false)}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={initiative?.project_ids ?? []}
        projectIds={joinedProjectIds ?? []}
      />
      {epicModal}
    </>
  );
});
