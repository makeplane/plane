import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// ce imports
import { IssueTypeSwitcher as BaseIssueTypeSwitcher, TIssueTypeSwitcherProps } from "@/ce/components/issues";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// store hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export const IssueTypeSwitcher: React.FC<TIssueTypeSwitcherProps> = observer((props) => {
  const { issueId, disabled } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isCreateUpdateIssueModalOpen, setIsCreateUpdateIssueModalOpen] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TIssue | undefined>(undefined);
  // store hooks
  const {
    issue: { getIssueById },
    toggleCreateIssueModal,
    fetchActivities,
  } = useIssueDetail();
  const { isWorkItemTypeEnabledForProject } = useIssueTypes();
  // derived values
  const issue = getIssueById(issueId);
  if (!issue || !issue.project_id) return <></>;
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), issue.project_id);

  if (!isWorkItemTypeEnabled) {
    return <BaseIssueTypeSwitcher {...props} />;
  }

  const handleEditIssue = () => {
    if (disabled) return;
    setIssueToEdit(issue);
    setIsCreateUpdateIssueModalOpen(true);
    toggleCreateIssueModal(true);
  };

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={isCreateUpdateIssueModalOpen}
        onSubmit={async () => {
          if (workspaceSlug && issue.project_id) {
            await fetchActivities(workspaceSlug.toString(), issue.project_id, issueId);
          }
        }}
        onClose={() => {
          setIsCreateUpdateIssueModalOpen(false);
          toggleCreateIssueModal(false);
          setIssueToEdit(undefined);
        }}
        data={issueToEdit}
        fetchIssueDetails={false}
      />
      <div className={cn("group flex items-center gap-3 cursor-pointer")}>
        <IssueIdentifier issueId={issueId} projectId={issue.project_id} size="md" enableClickToCopyIdentifier />
        <button
          type="button"
          className={cn(
            "flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center gap-1 text-xs font-medium text-custom-text-300 hover:text-custom-text-200",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            {
              "text-custom-text-400 hover:text-custom-text-400": disabled,
            }
          )}
          disabled={disabled}
          onClick={handleEditIssue}
        >
          <ArrowRightLeft className="w-3 h-3 flex-shrink-0" />
          Switch work item type
        </button>
      </div>
    </>
  );
});
