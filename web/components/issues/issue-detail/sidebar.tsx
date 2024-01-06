import React, { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { Controller, UseFormWatch } from "react-hook-form";
import { Bell, CalendarDays, LinkIcon, Signal, Tag, Trash2, Triangle, LayoutPanelTop } from "lucide-react";
// hooks
import { useEstimate, useIssueDetail, useIssues, useProject, useProjectState, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
import useUserIssueNotificationSubscription from "hooks/use-issue-notification-subscription";
// services
import { IssueService } from "services/issue";
import { ModuleService } from "services/module.service";
// components
import {
  DeleteIssueModal,
  SidebarIssueRelationSelect,
  SidebarCycleSelect,
  SidebarModuleSelect,
  SidebarParentSelect,
  SidebarLabelSelect,
  IssueLinkRoot,
} from "components/issues";
import { EstimateDropdown, PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// ui
import { CustomDatePicker } from "components/ui";
// icons
import { Button, ContrastIcon, DiceIcon, DoubleCircleIcon, StateGroupIcon, UserGroupIcon } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { TIssue } from "@plane/types";
import type { TIssueOperations } from "./root";
// fetch-keys
import { ISSUE_DETAILS } from "constants/fetch-keys";
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

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
  // store hooks
  const { getProjectById } = useProject();
  const {
    issues: { removeIssue },
  } = useIssues(EIssuesStoreType.PROJECT);
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
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

  const startDate = watchIssue("start_date");
  const targetDate = watchIssue("target_date");

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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
              {projectDetails?.identifier}-{issueDetail?.sequence_id}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {issueDetail?.created_by !== currentUser?.id &&
              !issueDetail?.assignee_ids.includes(currentUser?.id ?? "") &&
              !is_archived &&
              (fieldsToShow.includes("all") || fieldsToShow.includes("subscribe")) && (
                <Button
                  size="sm"
                  prependIcon={<Bell className="h-3 w-3" />}
                  variant="outline-primary"
                  className="hover:!bg-custom-primary-100/20"
                  onClick={() => {
                    if (subscribed) handleUnsubscribe();
                    else handleSubscribe();
                  }}
                >
                  {loading ? "Loading..." : subscribed ? "Unsubscribe" : "Subscribe"}
                </Button>
              )}
            {(fieldsToShow.includes("all") || fieldsToShow.includes("link")) && (
              <button
                type="button"
                className="rounded-md border border-custom-border-200 p-2 shadow-sm duration-300 hover:bg-custom-background-90 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary"
                onClick={handleCopyText}
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
            )}
            {isAllowed && (fieldsToShow.includes("all") || fieldsToShow.includes("delete")) && (
              <button
                type="button"
                className="rounded-md border border-red-500 p-2 text-red-500 shadow-sm duration-300 hover:bg-red-500/20 focus:outline-none"
                onClick={() => setDeleteIssueModal(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="h-full w-full overflow-y-auto px-5">
          <div className={`divide-y-2 divide-custom-border-200 ${is_editable ? "opacity-60" : ""}`}>
            {showFirstSection && (
              <div className="py-1">
                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("state")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
                      <p>State</p>
                    </div>
                    <Controller
                      control={control}
                      name="state"
                      render={({ field: { value } }) => (
                        <div className="h-5 sm:w-1/2">
                          <StateDropdown
                            value={value}
                            onChange={(val) => submitChanges({ state: val })}
                            projectId={projectId?.toString() ?? ""}
                            disabled={!isAllowed || is_editable}
                            buttonVariant="background-with-text"
                          />
                        </div>
                      )}
                    />
                  </div>
                )} */}

                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("assignee")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Assignees</p>
                    </div>
                    <Controller
                      control={control}
                      name="assignees"
                      render={({ field: { value } }) => (
                        <div className="h-5 sm:w-1/2">
                          <ProjectMemberDropdown
                            value={value}
                            onChange={(val) => submitChanges({ assignees: val })}
                            disabled={!isAllowed || is_editable}
                            projectId={projectId?.toString() ?? ""}
                            placeholder="Assignees"
                            multiple
                            buttonVariant={value?.length > 0 ? "transparent-without-text" : "background-with-text"}
                            buttonClassName={value?.length > 0 ? "hover:bg-transparent px-0" : ""}
                          />
                        </div>
                      )}
                    />
                  </div>
                )} */}

                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("priority")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <Signal className="h-4 w-4 flex-shrink-0" />
                      <p>Priority</p>
                    </div>
                    <Controller
                      control={control}
                      name="priority"
                      render={({ field: { value } }) => (
                        <div className="h-5 sm:w-1/2">
                          <PriorityDropdown
                            value={value}
                            onChange={(val) => submitChanges({ priority: val })}
                            disabled={!isAllowed || is_editable}
                            buttonVariant="background-with-text"
                          />
                        </div>
                      )}
                    />
                  </div>
                )} */}

                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("estimate")) &&
                  areEstimatesEnabledForCurrentProject && (
                    <div className="flex flex-wrap items-center py-2">
                      <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                        <Triangle className="h-4 w-4 flex-shrink-0 " />
                        <p>Estimate</p>
                      </div>
                      <Controller
                        control={control}
                        name="estimate_point"
                        render={({ field: { value } }) => (
                          <div className="h-5 sm:w-1/2">
                            <EstimateDropdown
                              value={value}
                              onChange={(val) => submitChanges({ estimate_point: val })}
                              projectId={projectId?.toString() ?? ""}
                              disabled={!isAllowed || is_editable}
                              buttonVariant="background-with-text"
                            />
                          </div>
                        )}
                      />
                    </div>
                  )} */}
              </div>
            )}

            {showSecondSection && (
              <div className="py-1">
                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("parent")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <LayoutPanelTop className="h-4 w-4 flex-shrink-0" />
                      <p>Parent</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="parent"
                        render={({ field: { onChange } }) => (
                          <SidebarParentSelect
                            onChange={(val: string) => {
                              submitChanges({ parent: val });
                              onChange(val);
                            }}
                            issueDetails={issueDetail}
                            disabled={!isAllowed || is_editable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )} */}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("blocker")) && (
                  <SidebarIssueRelationSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    relationKey="blocking"
                    disabled={!isAllowed || is_editable}
                  />
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("blocked")) && (
                  <SidebarIssueRelationSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    relationKey="blocked_by"
                    disabled={!isAllowed || is_editable}
                  />
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("duplicate")) && (
                  <SidebarIssueRelationSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    relationKey="duplicate"
                    disabled={!isAllowed || is_editable}
                  />
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("relates_to")) && (
                  <SidebarIssueRelationSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    relationKey="relates_to"
                    disabled={!isAllowed || is_editable}
                  />
                )}

                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("startDate")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <p>Start date</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="start_date"
                        render={({ field: { value } }) => (
                          <CustomDatePicker
                            placeholder="Start date"
                            value={value}
                            onChange={(val) =>
                              submitChanges({
                                start_date: val,
                              })
                            }
                            className="border-none bg-custom-background-80"
                            maxDate={maxDate ?? undefined}
                            disabled={!isAllowed || is_editable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )} */}

                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("dueDate")) && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <p>Due date</p>
                    </div>
                    <div className="sm:basis-1/2">
                      <Controller
                        control={control}
                        name="target_date"
                        render={({ field: { value } }) => (
                          <CustomDatePicker
                            placeholder="Due date"
                            value={value}
                            onChange={(val) =>
                              submitChanges({
                                target_date: val,
                              })
                            }
                            className="border-none bg-custom-background-80"
                            minDate={minDate ?? undefined}
                            disabled={!isAllowed || is_editable}
                          />
                        )}
                      />
                    </div>
                  </div>
                )} */}
              </div>
            )}

            {showThirdSection && (
              <div className="py-1">
                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("cycle")) && projectDetails?.cycle_view && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <ContrastIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Cycle</p>
                    </div>
                    <div className="space-y-1">
                      <SidebarCycleSelect
                        issueDetail={issueDetail}
                        handleCycleChange={handleCycleChange}
                        disabled={!isAllowed || is_editable}
                      />
                    </div>
                  </div>
                )} */}

                {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("module")) && projectDetails?.module_view && (
                  <div className="flex flex-wrap items-center py-2">
                    <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                      <DiceIcon className="h-4 w-4 flex-shrink-0" />
                      <p>Module</p>
                    </div>
                    <div className="space-y-1">
                      <SidebarModuleSelect
                        issueDetail={issueDetail}
                        handleModuleChange={handleModuleChange}
                        disabled={!isAllowed || is_editable}
                      />
                    </div>
                  </div>
                )} */}
              </div>
            )}
          </div>

          {/* {(fieldsToShow.includes("all") || fieldsToShow.includes("label")) && (
            <div className="flex flex-wrap items-start py-2">
              <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <p>Label</p>
              </div>
              <div className="space-y-1 sm:w-1/2">
                <SidebarLabelSelect
                  issueDetails={issueDetail}
                  labelList={issueDetail?.label_ids ?? []}
                  submitChanges={submitChanges}
                  isNotAllowed={!isAllowed}
                  is_editable={is_editable || !isAllowed}
                />
              </div>
            </div>
          )} */}

          {(fieldsToShow.includes("all") || fieldsToShow.includes("link")) && (
            <IssueLinkRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              is_editable={is_editable}
              is_archived={is_archived}
            />
          )}
        </div>
      </div>
    </>
  );
});
