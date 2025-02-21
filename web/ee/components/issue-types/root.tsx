"use client";
import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web components
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
      <div className="flex items-center justify-between border-b border-custom-border-100 pb-3.5 gap-14">
        <h3 className="text-xl font-medium">{t("work_item_types.label")}</h3>
        {isWorkItemTypeEnabled && (
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            {t("work_item_types.create.button")}
          </Button>
        )}
      </div>
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
