import { useState } from "react";

// next
import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// services
import issuesService from "services/issues.service";
import projectService from "services/project.service";
// hooks
import useProjects from "hooks/use-projects";
// components
import { SingleListIssue, ListInlineCreateIssueForm } from "components/core";
// ui
import { Avatar, CustomMenu } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { PriorityIcon, StateGroupIcon } from "components/icons";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import {
  ICurrentUserResponse,
  IIssue,
  IIssueLabels,
  IIssueViewProps,
  IState,
  TIssuePriorities,
  TStateGroups,
  UserAuth,
} from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS, WORKSPACE_LABELS } from "constants/fetch-keys";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

type Props = {
  currentState?: IState | null;
  groupTitle: string;
  addIssueToGroup: () => void;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleDraftIssueAction?: (issue: IIssue, action: "edit" | "delete") => void;
  openIssuesListModal?: (() => void) | null;
  handleMyIssueOpen?: (issue: IIssue) => void;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  disableUserActions: boolean;
  disableAddIssueOption?: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const SingleList: React.FC<Props> = (props) => {
  const {
    currentState,
    groupTitle,
    handleIssueAction,
    openIssuesListModal,
    handleDraftIssueAction,
    handleMyIssueOpen,
    addIssueToGroup,
    removeIssue,
    disableUserActions,
    disableAddIssueOption = false,
    user,
    userAuth,
    viewProps,
  } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const [isCreateIssueFormOpen, setIsCreateIssueFormOpen] = useState(false);

  const isMyIssuesPage = router.pathname.split("/")[3] === "my-issues";
  const isProfileIssuesPage = router.pathname.split("/")[2] === "profile";
  const isDraftIssuesPage = router.pathname.split("/")[4] === "draft-issues";

  const isArchivedIssues = router.pathname.includes("archived-issues");

  const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

  const { displayFilters, groupedIssues } = viewProps;

  const { data: issueLabels } = useSWR(
    workspaceSlug && projectId && displayFilters?.group_by === "labels"
      ? PROJECT_ISSUE_LABELS(projectId.toString())
      : null,
    workspaceSlug && projectId && displayFilters?.group_by === "labels"
      ? () => issuesService.getIssueLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const { data: workspaceLabels } = useSWR(
    workspaceSlug && displayFilters?.group_by === "labels"
      ? WORKSPACE_LABELS(workspaceSlug.toString())
      : null,
    workspaceSlug && displayFilters?.group_by === "labels"
      ? () => issuesService.getWorkspaceLabels(workspaceSlug.toString())
      : null
  );

  const { data: members } = useSWR(
    workspaceSlug &&
      projectId &&
      (displayFilters?.group_by === "created_by" || displayFilters?.group_by === "assignees")
      ? PROJECT_MEMBERS(projectId as string)
      : null,
    workspaceSlug &&
      projectId &&
      (displayFilters?.group_by === "created_by" || displayFilters?.group_by === "assignees")
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const { projects } = useProjects();

  const getGroupTitle = () => {
    let title = addSpaceIfCamelCase(groupTitle);

    switch (displayFilters?.group_by) {
      case "state":
        title = addSpaceIfCamelCase(currentState?.name ?? "");
        break;
      case "labels":
        title =
          [...(issueLabels ?? []), ...(workspaceLabels ?? [])]?.find(
            (label) => label.id === groupTitle
          )?.name ?? "None";
        break;
      case "project":
        title = projects?.find((p) => p.id === groupTitle)?.name ?? "None";
        break;
      case "assignees":
      case "created_by":
        const member = members?.find((member) => member.member.id === groupTitle)?.member;
        title = member ? member.display_name : "None";
        break;
    }

    return title;
  };

  const getGroupIcon = () => {
    let icon;

    switch (displayFilters?.group_by) {
      case "state":
        icon = currentState && (
          <StateGroupIcon
            stateGroup={currentState.group}
            color={currentState.color}
            height="16px"
            width="16px"
          />
        );
        break;
      case "state_detail.group":
        icon = (
          <StateGroupIcon
            stateGroup={groupTitle as TStateGroups}
            color={STATE_GROUP_COLORS[groupTitle as TStateGroups]}
            height="16px"
            width="16px"
          />
        );
        break;
      case "priority":
        icon = <PriorityIcon priority={groupTitle as TIssuePriorities} className="text-lg" />;
        break;
      case "project":
        const project = projects?.find((p) => p.id === groupTitle);
        icon =
          project &&
          (project.emoji !== null
            ? renderEmoji(project.emoji)
            : project.icon_prop !== null
            ? renderEmoji(project.icon_prop)
            : null);
        break;
      case "labels":
        const labelColor =
          [...(issueLabels ?? []), ...(workspaceLabels ?? [])]?.find(
            (label) => label.id === groupTitle
          )?.color ?? "#000000";
        icon = (
          <span
            className="h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: labelColor }}
          />
        );
        break;
      case "assignees":
      case "created_by":
        const member = members?.find((member) => member.member.id === groupTitle)?.member;
        icon = member ? <Avatar user={member} height="24px" width="24px" fontSize="12px" /> : <></>;

        break;
    }

    return icon;
  };

  if (!groupedIssues) return null;

  return (
    <Disclosure as="div" defaultOpen>
      {({ open }) => (
        <div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-custom-background-90">
            <Disclosure.Button>
              <div className="flex items-center gap-x-3">
                {displayFilters?.group_by !== null && (
                  <div className="flex items-center">{getGroupIcon()}</div>
                )}
                {displayFilters?.group_by !== null ? (
                  <h2
                    className={`text-sm font-semibold leading-6 text-custom-text-100 ${
                      displayFilters?.group_by === "created_by" ? "" : "capitalize"
                    }`}
                  >
                    {getGroupTitle()}
                  </h2>
                ) : (
                  <h2 className="font-medium leading-5">All Issues</h2>
                )}
                <span className="text-custom-text-200 min-w-[2.5rem] rounded-full bg-custom-background-80 py-1 text-center text-xs">
                  {groupedIssues[groupTitle as keyof IIssue].length}
                </span>
              </div>
            </Disclosure.Button>
            {isArchivedIssues ? (
              ""
            ) : type === "issue" ? (
              !disableAddIssueOption && (
                <button
                  type="button"
                  className="p-1  text-custom-text-200 hover:bg-custom-background-80"
                  onClick={() => setIsCreateIssueFormOpen(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              )
            ) : disableUserActions ? (
              ""
            ) : (
              <CustomMenu
                customButton={
                  <div className="flex cursor-pointer items-center">
                    <PlusIcon className="h-4 w-4" />
                  </div>
                }
                position="right"
                noBorder
              >
                <CustomMenu.MenuItem onClick={() => setIsCreateIssueFormOpen(true)}>
                  Create new
                </CustomMenu.MenuItem>
                {openIssuesListModal && (
                  <CustomMenu.MenuItem onClick={openIssuesListModal}>
                    Add an existing issue
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            )}
          </div>
          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform opacity-0"
            enterTo="transform opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform opacity-100"
            leaveTo="transform opacity-0"
          >
            <Disclosure.Panel>
              {groupedIssues[groupTitle] ? (
                groupedIssues[groupTitle].length > 0 ? (
                  groupedIssues[groupTitle].map((issue, index) => (
                    <SingleListIssue
                      key={issue.id}
                      type={type}
                      issue={issue}
                      projectId={issue.project_detail.id}
                      groupTitle={groupTitle}
                      index={index}
                      editIssue={() => handleIssueAction(issue, "edit")}
                      makeIssueCopy={() => handleIssueAction(issue, "copy")}
                      handleDeleteIssue={() => handleIssueAction(issue, "delete")}
                      handleDraftIssueSelect={
                        handleDraftIssueAction
                          ? () => handleDraftIssueAction(issue, "edit")
                          : undefined
                      }
                      handleDraftIssueDelete={
                        handleDraftIssueAction
                          ? () => handleDraftIssueAction(issue, "delete")
                          : undefined
                      }
                      handleMyIssueOpen={handleMyIssueOpen}
                      removeIssue={() => {
                        if (removeIssue !== null && issue.bridge_id)
                          removeIssue(issue.bridge_id, issue.id);
                      }}
                      disableUserActions={disableUserActions}
                      user={user}
                      userAuth={userAuth}
                      viewProps={viewProps}
                    />
                  ))
                ) : (
                  <p className="bg-custom-background-100 px-4 py-2.5 text-sm text-custom-text-200">
                    No issues.
                  </p>
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center">Loading...</div>
              )}

              <ListInlineCreateIssueForm
                isOpen={isCreateIssueFormOpen && !disableAddIssueOption}
                handleClose={() => setIsCreateIssueFormOpen(false)}
                prePopulatedData={{
                  ...(cycleId && { cycle: cycleId.toString() }),
                  ...(moduleId && { module: moduleId.toString() }),
                  [displayFilters?.group_by!]: groupTitle,
                }}
              />

              {!disableAddIssueOption && !isCreateIssueFormOpen && (
                <div className="w-full bg-custom-background-100 px-6 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDraftIssuesPage || isMyIssuesPage || isProfileIssuesPage) {
                        addIssueToGroup();
                      } else setIsCreateIssueFormOpen(true);
                    }}
                    className="flex items-center gap-x-[6px] text-custom-primary-100 px-2 py-1 rounded-md"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span className="text-sm font-medium text-custom-primary-100">New Issue</span>
                  </button>
                </div>
              )}
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};
