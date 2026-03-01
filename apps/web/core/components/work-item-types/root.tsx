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

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// plane web imports
import { SettingsHeading } from "@/components/settings/heading";
import { useIssueTypes } from "@/plane-web/hooks/store";
// local imports
import { CreateOrUpdateIssueTypeModal } from "./create-update/modal";
import { IssueTypeEmptyState } from "./empty-state";
import { IssueTypeDeleteConfirmationModal } from "./issue-type-delete-confirmation-modal";
import { IssueTypesList } from "./issue-types-list";

type TIssueTypesRoot = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueTypesRoot = observer(function IssueTypesRoot(props: TIssueTypesRoot) {
  const { workspaceSlug, projectId } = props;
  // states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [editIssueTypeId, setEditIssueTypeId] = useState<string | null>(null);
  const [deleteIssueTypeId, setDeleteIssueTypeId] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // plane web store hooks
  const { isWorkItemTypeEnabledForProject, getIssueTypeById } = useIssueTypes();
  // derived values
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, projectId);

  const handleEditIssueTypeIdChange = (issueTypeId: string) => {
    setEditIssueTypeId(issueTypeId);
    setIsModalOpen(true);
  };

  const handleDeleteIssueTypeIdChange = (issueTypeId: string) => {
    setDeleteIssueTypeId(issueTypeId);
    setIsDeleteModalOpen(true);
  };

  const handleEnableDisableIssueType = useCallback(
    async (issueTypeId: string) => {
      if (!issueTypeId) return;
      const issueType = getIssueTypeById(issueTypeId);
      if (!issueType) return;
      const issueTypeDetail = issueType.asJSON;

      const updateIssueTypePromise = issueType?.updateType({
        is_active: !issueTypeDetail?.is_active,
      });
      if (!updateIssueTypePromise) return;
      await updateIssueTypePromise.finally(() => {
        setIsModalOpen(false);
      });
    },
    [getIssueTypeById]
  );

  return (
    <div className="container mx-auto h-full pb-8">
      <SettingsHeading
        title={t("project_settings.work_item_types.heading")}
        description={t("project_settings.work_item_types.description")}
        control={
          isWorkItemTypeEnabled && (
            <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
              {t("work_item_types.create.button")}
            </Button>
          )
        }
      />
      <div className="h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {isWorkItemTypeEnabled ? (
          <IssueTypesList
            onEditIssueTypeIdChange={handleEditIssueTypeIdChange}
            onDeleteIssueTypeIdChange={handleDeleteIssueTypeIdChange}
            onEnableDisableIssueType={handleEnableDisableIssueType}
          />
        ) : (
          <IssueTypeEmptyState workspaceSlug={workspaceSlug} projectId={projectId} />
        )}
      </div>
      {/* Modal */}
      <CreateOrUpdateIssueTypeModal
        issueTypeId={editIssueTypeId}
        isModalOpen={isModalOpen}
        handleModalClose={() => {
          setEditIssueTypeId(null);
          setIsModalOpen(false);
        }}
      />
      <IssueTypeDeleteConfirmationModal
        issueTypeId={deleteIssueTypeId}
        isModalOpen={isDeleteModalOpen}
        handleModalClose={() => setIsDeleteModalOpen(false)}
        handleEnableDisable={handleEnableDisableIssueType}
      />
    </div>
  );
});
