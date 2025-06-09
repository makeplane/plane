"use client";
import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web components
import { SettingsHeading } from "@/components/settings";
import { IssueTypeEmptyState, IssueTypesList, CreateOrUpdateIssueTypeModal } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export const IssueTypesRoot = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editIssueTypeId, setEditIssueTypeId] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // plane web store hooks
  const { isWorkItemTypeEnabledForProject } = useIssueTypes();
  // derived values
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId?.toString());

  const handleEditIssueTypeIdChange = (issueTypeId: string) => {
    setEditIssueTypeId(issueTypeId);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto h-full pb-8">
      <SettingsHeading
        title={t("project_settings.work_item_types.heading")}
        description={t("project_settings.work_item_types.description")}
        showButton={isWorkItemTypeEnabled}
        button={{
          label: t("work_item_types.create.button"),
          onClick: () => setIsModalOpen(true),
        }}
      />
      <div className="my-2 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {isWorkItemTypeEnabled ? (
          <IssueTypesList onEditIssueTypeIdChange={handleEditIssueTypeIdChange} />
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
    </div>
  );
});
