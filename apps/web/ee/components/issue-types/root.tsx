"use client";
import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { WORK_ITEM_TYPE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// plane web components
import { SettingsHeading } from "@/components/settings/heading";
import { captureClick } from "@/helpers/event-tracker.helper";
import { IssueTypeEmptyState, IssueTypesList, CreateOrUpdateIssueTypeModal } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
import { IssueTypeDeleteConfirmationModal } from "./issue-type-delete-confirmation-modal";

export const IssueTypesRoot = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
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
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId?.toString());

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
        showButton={isWorkItemTypeEnabled}
        button={{
          label: t("work_item_types.create.button"),
          onClick: () => {
            captureClick({
              elementName: WORK_ITEM_TYPE_TRACKER_ELEMENTS.HEADER_CREATE_WORK_ITEM_TYPE_BUTTON,
            });
            setIsModalOpen(true);
          },
        }}
      />
      <div className="my-2 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {isWorkItemTypeEnabled ? (
          <IssueTypesList
            onEditIssueTypeIdChange={handleEditIssueTypeIdChange}
            onDeleteIssueTypeIdChange={handleDeleteIssueTypeIdChange}
            onEnableDisableIssueType={handleEnableDisableIssueType}
          />
        ) : (
          <IssueTypeEmptyState workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
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
