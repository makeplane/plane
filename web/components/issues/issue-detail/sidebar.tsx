import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import {
  LinkIcon,
  Signal,
  Tag,
  Trash2,
  Triangle,
  LayoutPanelTop,
  XCircle,
  CircleDot,
  CopyPlus,
  CalendarClock,
  CalendarCheck2,
} from "lucide-react";
// hooks
import { useEstimate, useIssueDetail, useProject, useProjectState, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import {
  DeleteIssueModal,
  IssueLinkRoot,
  IssueRelationSelect,
  IssueCycleSelect,
  IssueModuleSelect,
  IssueParentSelect,
  IssueLabel,
  ArchiveIssueModal,
} from "components/issues";
import { IssueSubscription } from "./subscription";
import { DateDropdown, EstimateDropdown, PriorityDropdown, MemberDropdown, StateDropdown } from "components/dropdowns";
// icons
import { ArchiveIcon, ContrastIcon, DiceIcon, DoubleCircleIcon, RelatedIcon, Tooltip, UserGroupIcon } from "@plane/ui";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
import { cn } from "helpers/common.helper";
import { shouldHighlightIssueDueDate } from "helpers/issue.helper";
// types
import type { TIssueOperations } from "./root";
import { STATE_GROUPS } from "constants/state";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  is_archived: boolean;
  is_editable: boolean;
};

export const IssueDetailsSidebar: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, is_archived, is_editable } = props;
  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  // router
  const router = useRouter();
  // store hooks
  const { getProjectById } = useProject();
  const { currentUser } = useUser();
  const { areEstimatesEnabledForCurrentProject } = useEstimate();
  const { setToastAlert } = useToast();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const handleDeleteIssue = async () => {
    await issueOperations.remove(workspaceSlug, projectId, issueId);
    router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
  };

  const handleArchiveIssue = async () => {
    if (!issueOperations.archive) return;
    await issueOperations.archive(workspaceSlug, projectId, issueId);
    router.push(`/${workspaceSlug}/projects/${projectId}/archived-issues/${issue.id}`);
  };
  // derived values
  const projectDetails = getProjectById(issue.project_id);
  const stateDetails = getStateById(issue.state_id);
  // auth
  const isArchivingAllowed = !is_archived && issueOperations.archive && is_editable;
  const isInArchivableGroup =
    !!stateDetails && [STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key].includes(stateDetails?.group);

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <>
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issue}
        onSubmit={handleDeleteIssue}
      />
      <ArchiveIssueModal
        isOpen={archiveIssueModal}
        handleClose={() => setArchiveIssueModal(false)}
        data={issue}
        onSubmit={handleArchiveIssue}
      />
      <div className="flex h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
        <div className="flex items-center justify-end px-5 pb-3">
          <div className="flex flex-wrap items-center gap-4">
            {currentUser && !is_archived && (
              <IssueSubscription workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
            )}
            <div className="flex items-center flex-wrap gap-2.5 text-custom-text-300">
              <Tooltip tooltipContent="Copy link">
                <button
                  type="button"
                  className="h-5 w-5 grid place-items-center hover:text-custom-text-200 rounded focus:outline-none focus:ring-2 focus:ring-custom-primary"
                  onClick={handleCopyText}
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              </Tooltip>
              {isArchivingAllowed && (
                <Tooltip
                  tooltipContent={isInArchivableGroup ? "Archive" : "Only completed or canceled issues can be archived"}
                >
                  <button
                    type="button"
                    className={cn(
                      "h-5 w-5 grid place-items-center rounded focus:outline-none focus:ring-2 focus:ring-custom-primary",
                      {
                        "hover:text-custom-text-200": isInArchivableGroup,
                        "cursor-not-allowed text-custom-text-400": !isInArchivableGroup,
                      }
                    )}
                    onClick={() => {
                      if (!isInArchivableGroup) return;
                      setArchiveIssueModal(true);
                    }}
                  >
                    <ArchiveIcon className="h-4 w-4" />
                  </button>
                </Tooltip>
              )}
              {is_editable && (
                <Tooltip tooltipContent="Delete">
                  <button
                    type="button"
                    className="h-5 w-5 grid place-items-center hover:text-custom-text-200 rounded focus:outline-none focus:ring-2 focus:ring-custom-primary"
                    onClick={() => setDeleteIssueModal(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        <div className="h-full w-full overflow-y-auto px-6">
          <h5 className="text-sm font-medium mt-6">Properties</h5>
          {/* TODO: render properties using a common component */}
          <div className={`mt-3 mb-2 space-y-2.5 ${!is_editable ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
                <span>State</span>
              </div>
              <StateDropdown
                value={issue?.state_id ?? undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
                projectId={projectId?.toString() ?? ""}
                disabled={!is_editable}
                buttonVariant="transparent-with-text"
                className="w-3/5 flex-grow group"
                buttonContainerClassName="w-full text-left"
                buttonClassName="text-sm"
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
              />
            </div>

            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                <span>Assignees</span>
              </div>
              <MemberDropdown
                value={issue?.assignee_ids ?? undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
                disabled={!is_editable}
                projectId={projectId?.toString() ?? ""}
                placeholder="Add assignees"
                multiple
                buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
                className="w-3/5 flex-grow group"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-sm justify-between ${
                  issue?.assignee_ids.length > 0 ? "" : "text-custom-text-400"
                }`}
                hideIcon={issue.assignee_ids?.length === 0}
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
              />
            </div>

            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <Signal className="h-4 w-4 flex-shrink-0" />
                <span>Priority</span>
              </div>
              <PriorityDropdown
                value={issue?.priority || undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
                disabled={!is_editable}
                buttonVariant="border-with-text"
                className="w-3/5 flex-grow rounded px-2 hover:bg-custom-background-80"
                buttonContainerClassName="w-full text-left"
                buttonClassName="w-min h-auto whitespace-nowrap"
              />
            </div>

            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <CalendarClock className="h-4 w-4 flex-shrink-0" />
                <span>Start date</span>
              </div>
              <DateDropdown
                placeholder="Add start date"
                value={issue.start_date}
                onChange={(val) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, {
                    start_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                maxDate={maxDate ?? undefined}
                disabled={!is_editable}
                buttonVariant="transparent-with-text"
                className="w-3/5 flex-grow group"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-sm ${issue?.start_date ? "" : "text-custom-text-400"}`}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline"
                // TODO: add this logic
                // showPlaceholderIcon
              />
            </div>

            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <CalendarCheck2 className="h-4 w-4 flex-shrink-0" />
                <span>Due date</span>
              </div>
              <DateDropdown
                placeholder="Add due date"
                value={issue.target_date}
                onChange={(val) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, {
                    target_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                minDate={minDate ?? undefined}
                disabled={!is_editable}
                buttonVariant="transparent-with-text"
                className="w-3/5 flex-grow group"
                buttonContainerClassName="w-full text-left"
                buttonClassName={cn("text-sm", {
                  "text-custom-text-400": !issue.target_date,
                  "text-red-500": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
                })}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline !text-custom-text-100"
                // TODO: add this logic
                // showPlaceholderIcon
              />
            </div>

            {areEstimatesEnabledForCurrentProject && (
              <div className="flex items-center gap-2 h-8">
                <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                  <Triangle className="h-4 w-4 flex-shrink-0" />
                  <span>Estimate</span>
                </div>
                <EstimateDropdown
                  value={issue?.estimate_point !== null ? issue.estimate_point : null}
                  onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })}
                  projectId={projectId}
                  disabled={!is_editable}
                  buttonVariant="transparent-with-text"
                  className="w-3/5 flex-grow group"
                  buttonContainerClassName="w-full text-left"
                  buttonClassName={`text-sm ${issue?.estimate_point !== null ? "" : "text-custom-text-400"}`}
                  placeholder="None"
                  hideIcon
                  dropdownArrow
                  dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
                />
              </div>
            )}

            {projectDetails?.module_view && (
              <div className="flex gap-2 min-h-8">
                <div className="flex gap-1 pt-2 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                  <DiceIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Module</span>
                </div>
                <IssueModuleSelect
                  className="w-3/5 flex-grow"
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={!is_editable}
                />
              </div>
            )}

            {projectDetails?.cycle_view && (
              <div className="flex items-center gap-2 h-8">
                <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                  <ContrastIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Cycle</span>
                </div>
                <IssueCycleSelect
                  className="w-3/5 flex-grow"
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={!is_editable}
                />
              </div>
            )}

            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <LayoutPanelTop className="h-4 w-4 flex-shrink-0" />
                <span>Parent</span>
              </div>
              <IssueParentSelect
                className="w-3/5 flex-grow h-full"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                disabled={!is_editable}
              />
            </div>

            <div className="flex gap-2 min-h-8">
              <div className="flex gap-1 pt-2 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <RelatedIcon className="h-4 w-4 flex-shrink-0" />
                <span>Relates to</span>
              </div>
              <IssueRelationSelect
                className="w-3/5 flex-grow min-h-8 h-full"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                relationKey="relates_to"
                disabled={!is_editable}
              />
            </div>

            <div className="flex gap-2 min-h-8">
              <div className="flex gap-1 pt-2 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                <span>Blocking</span>
              </div>
              <IssueRelationSelect
                className="w-3/5 flex-grow min-h-8 h-full"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                relationKey="blocking"
                disabled={!is_editable}
              />
            </div>

            <div className="flex gap-2 min-h-8">
              <div className="flex gap-1 pt-2 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <CircleDot className="h-4 w-4 flex-shrink-0" />
                <span>Blocked by</span>
              </div>
              <IssueRelationSelect
                className="w-3/5 flex-grow min-h-8 h-full"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                relationKey="blocked_by"
                disabled={!is_editable}
              />
            </div>

            <div className="flex gap-2 min-h-8">
              <div className="flex gap-1 pt-2 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <CopyPlus className="h-4 w-4 flex-shrink-0" />
                <span>Duplicate of</span>
              </div>
              <IssueRelationSelect
                className="w-3/5 flex-grow min-h-8 h-full"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                relationKey="duplicate"
                disabled={!is_editable}
              />
            </div>

            <div className="flex gap-2 min-h-8">
              <div className="flex gap-1 pt-2 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <span>Labels</span>
              </div>
              <div className="w-3/5 flex-grow min-h-8 h-full">
                <IssueLabel
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  disabled={!is_editable}
                />
              </div>
            </div>
          </div>

          <IssueLinkRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            disabled={!is_editable}
          />
        </div>
      </div>
    </>
  );
});
