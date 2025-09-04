"use-client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Trash2 } from "lucide-react";
// plane imports
import { ARCHIVABLE_STATE_GROUPS } from "@plane/constants";
import { ArchiveIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TDeDupeIssue } from "@plane/types";
import { Checkbox } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ArchiveIssueModal } from "@/components/issues/archive-issue-modal";
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
import type { TIssueOperations } from "@/components/issues/issue-detail";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane-web imports
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

type TDeDupeIssueBlockHeaderProps = {
  workspaceSlug: string;
  issue: TDeDupeIssue;
  selectionHelpers: TSelectionHelper;
  issueOperations?: TIssueOperations;
  readOnly?: boolean;
  disabled?: boolean;
  renderDeDupeActionModals?: boolean;
  isIntakeIssue?: boolean;
};

export const DeDupeIssueBlockHeader: FC<TDeDupeIssueBlockHeaderProps> = observer((props) => {
  const {
    workspaceSlug,
    issue,
    selectionHelpers,
    issueOperations,
    disabled = false,
    renderDeDupeActionModals,
    isIntakeIssue,
  } = props;
  // store
  const { getStateById } = useProjectState();
  const { getProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  const { isArchiveIssueModalOpen, toggleArchiveIssueModal, isDeleteIssueModalOpen, toggleDeleteIssueModal } =
    useIssueDetail();
  // derived values
  const stateDetails = issue ? getStateById(issue?.state_id) : undefined;
  const isArchivingAllowed = !disabled;
  const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);
  const isSelected = selectionHelpers.getIsEntitySelected(issue.id);
  const projectDetails = getProjectById(issue?.project_id);
  const projectIdentifier = projectDetails?.identifier ?? "";

  return (
    <>
      {renderDeDupeActionModals && issue && isArchiveIssueModalOpen === issue.id && (
        <ArchiveIssueModal
          isOpen={!!isArchiveIssueModalOpen}
          handleClose={() => toggleArchiveIssueModal(null)}
          data={issue}
          onSubmit={async () => {
            if (projectDetails && issueOperations?.archive)
              await issueOperations.archive(workspaceSlug, projectDetails?.id, issue.id);
          }}
        />
      )}

      {renderDeDupeActionModals && issue && isDeleteIssueModalOpen === issue.id && (
        <DeleteIssueModal
          isOpen={!!isDeleteIssueModalOpen}
          handleClose={() => {
            toggleDeleteIssueModal(null);
          }}
          data={issue}
          onSubmit={async () => {
            if (projectDetails) issueOperations?.remove(workspaceSlug, projectDetails.id, issue.id);
          }}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 ">
          {!isIntakeIssue && (
            <div
              className={cn(" hidden group-hover:block group-hover:pointer-events-auto transition-transform", {
                block: isSelected,
              })}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                selectionHelpers.handleEntityClick(e, issue.id, "de-dupe-issues");
              }}
            >
              <Checkbox
                className={cn("!outline-none size-3.5 pointer-events-none", {
                  "pointer-events-auto text-white": isSelected,
                })}
                iconClassName="size-3"
                checked={isSelected}
                data-entity-id={issue.id}
              />
            </div>
          )}
          <IssueIdentifier
            issueSequenceId={issue.sequence_id}
            projectIdentifier={projectIdentifier}
            issueTypeId={issue.type_id}
            projectId={issue.project_id}
            textContainerClassName="text-xs font-medium text-custom-text-300"
            size="xs"
            displayProperties={{
              key: true,
              issue_type: true,
            }}
          />
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100  transition-opacity">
          {isArchivingAllowed && (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={isInArchivableGroup ? "Archive" : "Only completed or canceled work items can be archived"}
            >
              <button
                type="button"
                className={cn("text-custom-text-300", {
                  "hover:text-custom-text-200": isInArchivableGroup,
                  "cursor-not-allowed text-custom-text-400": !isInArchivableGroup,
                })}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!isInArchivableGroup) return;
                  toggleArchiveIssueModal(issue.id);
                }}
              >
                <ArchiveIcon className="size-4" />
              </button>
            </Tooltip>
          )}
          {!disabled && (
            <Tooltip tooltipContent="Delete" isMobile={isMobile}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleDeleteIssueModal(issue.id);
                }}
              >
                <Trash2 className="size-4 text-custom-text-300 hover:text-custom-text-200" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
});
