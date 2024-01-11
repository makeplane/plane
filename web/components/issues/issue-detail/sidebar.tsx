import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { CalendarDays, LinkIcon, Signal, Tag, Trash2, Triangle, LayoutPanelTop } from "lucide-react";
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
} from "components/issues";
import { IssueSubscription } from "./subscription";
import { EstimateDropdown, PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// ui
import { CustomDatePicker } from "components/ui";
// icons
import { ContrastIcon, DiceIcon, DoubleCircleIcon, StateGroupIcon, UserGroupIcon } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { TIssueOperations } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  is_archived: boolean;
  is_editable: boolean;
  fieldsToShow?: (
    | "state"
    | "assignee"
    | "priority"
    | "estimate"
    | "parent"
    | "blocker"
    | "blocked"
    | "startDate"
    | "dueDate"
    | "cycle"
    | "module"
    | "label"
    | "link"
    | "delete"
    | "all"
    | "subscribe"
    | "duplicate"
    | "relates_to"
  )[];
};

export const IssueDetailsSidebar: React.FC<Props> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    issueOperations,
    is_archived,
    is_editable,
    fieldsToShow = ["all"],
  } = props;
  // router
  const router = useRouter();
  const { inboxIssueId } = router.query;
  // store hooks
  const { getProjectById } = useProject();
  const { currentUser } = useUser();
  const { projectStates } = useProjectState();
  const { areEstimatesEnabledForCurrentProject } = useEstimate();
  const { setToastAlert } = useToast();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

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

  const projectDetails = issue ? getProjectById(issue.project_id) : null;

  const showFirstSection =
    fieldsToShow.includes("all") ||
    fieldsToShow.includes("state") ||
    fieldsToShow.includes("assignee") ||
    fieldsToShow.includes("priority") ||
    fieldsToShow.includes("estimate");

  const showSecondSection =
    fieldsToShow.includes("all") ||
    fieldsToShow.includes("parent") ||
    fieldsToShow.includes("blocker") ||
    fieldsToShow.includes("blocked") ||
    fieldsToShow.includes("dueDate");

  const showThirdSection =
    fieldsToShow.includes("all") || fieldsToShow.includes("cycle") || fieldsToShow.includes("module");

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  const currentIssueState = projectStates?.find((s) => s.id === issue.state_id);

  return (
    <>
      {workspaceSlug && projectId && issue && (
        <DeleteIssueModal
          handleClose={() => setDeleteIssueModal(false)}
          isOpen={deleteIssueModal}
          data={issue}
          onSubmit={async () => {
            await issueOperations.remove(workspaceSlug, projectId, issueId);
            router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
          }}
        />
      )}

      <div className="flex h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="flex items-center gap-x-2">
            {currentIssueState ? (
              <StateGroupIcon
                className="h-4 w-4"
                stateGroup={currentIssueState.group}
                color={currentIssueState.color}
              />
            ) : inboxIssueId ? (
              <StateGroupIcon className="h-4 w-4" stateGroup="backlog" color="#ff7700" />
            ) : null}
            <h4 className="text-lg font-medium text-custom-text-300">
              {projectDetails?.identifier}-{issue?.sequence_id}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentUser && !is_archived && (fieldsToShow.includes("all") || fieldsToShow.includes("subscribe")) && (
              <IssueSubscription
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                currentUserId={currentUser?.id}
              />
            )}

            {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("link")) && (
              <button
                type="button"
                className="rounded-md border border-custom-border-200 p-2 shadow-sm duration-300 hover:bg-custom-background-90 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary"
                onClick={handleCopyText}
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
            )} */}

            {/* {isAllowed && (fieldsToShow.includes("all") || fieldsToShow.includes("delete")) && (
              <button
                type="button"
                className="rounded-md border border-red-500 p-2 text-red-500 shadow-sm duration-300 hover:bg-red-500/20 focus:outline-none"
                onClick={() => setDeleteIssueModal(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )} */}
          </div>
        </div>

        <div className="h-full w-full overflow-y-auto px-5">
          <div className={`divide-y-2 divide-custom-border-200 ${!is_editable ? "opacity-60" : ""}`}>
            {showFirstSection && (
              <div className="py-1">
                {(fieldsToShow.includes("all") || fieldsToShow.includes("state")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
                      <p>State</p>
                    </div>

                    <div className="h-5 sm:w-1/2">
                      <StateDropdown
                        value={issue?.state_id ?? undefined}
                        onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
                        projectId={projectId?.toString() ?? ""}
                        disabled={!is_editable}
                        buttonVariant="background-with-text"
                      />
                    </div>
                  </div>
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("assignee")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Assignees</p>
                    </div>

                    <div className="h-5 sm:w-1/2">
                      <ProjectMemberDropdown
                        value={issue?.assignee_ids ?? undefined}
                        onChange={(val) =>
                          issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })
                        }
                        disabled={!is_editable}
                        projectId={projectId?.toString() ?? ""}
                        placeholder="Assignees"
                        multiple
                        buttonVariant={
                          issue?.assignee_ids?.length > 0 ? "transparent-without-text" : "background-with-text"
                        }
                        buttonClassName={issue?.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
                      />
                    </div>
                  </div>
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("priority")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <Signal className="h-4 w-4 flex-shrink-0" />
                      <p>Priority</p>
                    </div>

                    <div className="h-5 sm:w-1/2">
                      <PriorityDropdown
                        value={issue?.priority || undefined}
                        onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
                        disabled={!is_editable}
                        buttonVariant="background-with-text"
                      />
                    </div>
                  </div>
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("estimate")) &&
                  areEstimatesEnabledForCurrentProject && (
                    <div className="flex flex-wrap items-center py-2">
                      <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                        <Triangle className="h-4 w-4 flex-shrink-0 " />
                        <p>Estimate</p>
                      </div>

                      <div className="h-5 sm:w-1/2">
                        <EstimateDropdown
                          value={issue?.estimate_point || null}
                          onChange={(val) =>
                            issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })
                          }
                          projectId={projectId}
                          disabled={!is_editable}
                          buttonVariant="background-with-text"
                        />
                      </div>
                    </div>
                  )}
              </div>
            )}

            {showSecondSection && (
              <div className="py-1">
                {(fieldsToShow.includes("all") || fieldsToShow.includes("parent")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <LayoutPanelTop className="h-4 w-4 flex-shrink-0" />
                      <p>Parent</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <IssueParentSelect
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        issueOperations={issueOperations}
                        disabled={!is_editable}
                      />
                    </div>
                  </div>
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("blocker")) && (
                  <IssueRelationSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    relationKey="blocking"
                    disabled={!is_editable}
                  />
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("blocked")) && (
                  <IssueRelationSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    relationKey="blocked_by"
                    disabled={!is_editable}
                  />
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("duplicate")) && (
                  <IssueRelationSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    relationKey="duplicate"
                    disabled={!is_editable}
                  />
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("relates_to")) && (
                  <IssueRelationSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    relationKey="relates_to"
                    disabled={!is_editable}
                  />
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("startDate")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <p>Start date</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <CustomDatePicker
                        placeholder="Start date"
                        value={issue.start_date || undefined}
                        onChange={(val) =>
                          issueOperations.update(workspaceSlug, projectId, issueId, { start_date: val })
                        }
                        className="border-none bg-custom-background-80"
                        maxDate={maxDate ?? undefined}
                        disabled={!is_editable}
                      />
                    </div>
                  </div>
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("dueDate")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <p>Due date</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <CustomDatePicker
                        placeholder="Due date"
                        value={issue.target_date || undefined}
                        onChange={(val) =>
                          issueOperations.update(workspaceSlug, projectId, issueId, { target_date: val })
                        }
                        className="border-none bg-custom-background-80"
                        minDate={minDate ?? undefined}
                        disabled={!is_editable}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {showThirdSection && (
              <div className="py-1">
                {(fieldsToShow.includes("all") || fieldsToShow.includes("cycle")) && projectDetails?.cycle_view && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <ContrastIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Cycle</p>
                    </div>
                    <div className="space-y-1">
                      <IssueCycleSelect
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        issueOperations={issueOperations}
                        disabled={!is_editable}
                      />
                    </div>
                  </div>
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("module")) && projectDetails?.module_view && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <DiceIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Module</p>
                    </div>
                    <div className="space-y-1">
                      <IssueModuleSelect
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        issueOperations={issueOperations}
                        disabled={!is_editable}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {(fieldsToShow.includes("all") || fieldsToShow.includes("label")) && (
            <div className={`flex flex-wrap items-start py-2 ${!is_editable ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <p>Label</p>
              </div>
              <div className="space-y-1 sm:w-1/2">
                <IssueLabel
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  disabled={!is_editable}
                />
              </div>
            </div>
          )}

          {(fieldsToShow.includes("all") || fieldsToShow.includes("link")) && (
            <IssueLinkRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={!is_editable}
            />
          )}
        </div>
      </div>
    </>
  );
});
