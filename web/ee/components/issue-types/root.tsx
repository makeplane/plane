"use client";
import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { Button } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";
// plane web components
import { CreateIssueTypeModal, IssueTypeEmptyState, IssueTypesList } from "@/plane-web/components/issue-types";

export const IssueTypesRoot = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { currentProjectDetails } = useProject();
  // states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <div className="container mx-auto h-full pb-8">
      <div className="flex items-center justify-between border-b border-custom-border-100 py-3.5 pr-4 gap-14">
        <h3 className="text-xl font-medium">Issue types</h3>
        {currentProjectDetails?.is_issue_type_enabled && (
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Add issue type
          </Button>
        )}
      </div>
      <div className="my-2 pr-4 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {currentProjectDetails?.is_issue_type_enabled ? (
          <IssueTypesList />
        ) : (
          <IssueTypeEmptyState workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
        )}
      </div>
      {/* Modal */}
      <CreateIssueTypeModal isModalOpen={isModalOpen} handleModalClose={() => setIsModalOpen(false)} />
    </div>
  );
});
