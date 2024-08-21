"use client";
import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
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
  // plane web store hooks
  const { isIssueTypeEnabledForProject } = useIssueTypes();
  // derived values
  const isIssueTypeSettingsEnabled = isIssueTypeEnabledForProject(
    workspaceSlug?.toString(),
    projectId?.toString(),
    "ISSUE_TYPE_SETTINGS"
  );

  const handleEditIssueTypeIdChange = (issueTypeId: string) => {
    setEditIssueTypeId(issueTypeId);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto h-full pb-8">
      <div className="flex items-center justify-between border-b border-custom-border-100 py-3.5 pr-4 gap-14">
        <h3 className="text-xl font-medium">Issue Types</h3>
        {isIssueTypeSettingsEnabled && (
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Add issue type
          </Button>
        )}
      </div>
      <div className="my-2 pr-4 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {isIssueTypeSettingsEnabled ? (
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
