"use client";
import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { Button } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";
// plane web components
import { IssueTypeEmptyState, IssueTypesList, CreateOrUpdateIssueTypeModal } from "@/plane-web/components/issue-types";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store";

export const IssueTypesRoot = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editIssueTypeId, setEditIssueTypeId] = useState<string | null>(null);
  // store hooks
  const { currentProjectDetails } = useProject();
  // derived values
  const isIssueTypeSettingsEnabled = useFlag(workspaceSlug?.toString(), "ISSUE_TYPE_SETTINGS");

  const handleEditIssueTypeIdChange = (issueTypeId: string) => {
    setEditIssueTypeId(issueTypeId);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto h-full pb-8">
      <div className="flex items-center justify-between border-b border-custom-border-100 py-3.5 pr-4 gap-14">
        <h3 className="text-xl font-medium">Issue types</h3>
        {isIssueTypeSettingsEnabled && currentProjectDetails?.is_issue_type_enabled && (
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Add issue type
          </Button>
        )}
      </div>
      <div className="my-2 pr-4 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {isIssueTypeSettingsEnabled && currentProjectDetails?.is_issue_type_enabled ? (
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
