import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
import projectService from "services/project.service";
// hooks
import useIssuesView from "hooks/use-issues-view";
// component
import { Avatar } from "components/ui";
// icons
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, PlusIcon } from "@heroicons/react/24/outline";
import { getPriorityIcon, getStateGroupIcon } from "components/icons";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssueLabels, IState } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  currentState?: IState | null;
  groupTitle: string;
  addIssueToState: () => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isCompleted?: boolean;
};

export const BoardHeader: React.FC<Props> = ({
  currentState,
  groupTitle,
  addIssueToState,
  isCollapsed,
  setIsCollapsed,
  isCompleted = false,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { groupedByIssues, groupByProperty: selectedGroup } = useIssuesView();

  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const getGroupTitle = () => {
    let title = addSpaceIfCamelCase(groupTitle);

    switch (selectedGroup) {
      case "state":
        title = addSpaceIfCamelCase(currentState?.name ?? "");
        break;
      case "labels":
        title = issueLabels?.find((label) => label.id === groupTitle)?.name ?? "None";
        break;
      case "created_by":
        const member = members?.find((member) => member.member.id === groupTitle)?.member;
        title =
          member?.first_name && member.first_name !== ""
            ? `${member.first_name} ${member.last_name}`
            : member?.email ?? "";
        break;
    }

    return title;
  };

  const getGroupIcon = () => {
    let icon;

    switch (selectedGroup) {
      case "state":
        icon =
          currentState && getStateGroupIcon(currentState.group, "16", "16", currentState.color);
        break;
      case "priority":
        icon = getPriorityIcon(groupTitle, "text-lg");
        break;
      case "labels":
        const labelColor =
          issueLabels?.find((label) => label.id === groupTitle)?.color ?? "#000000";
        icon = (
          <span
            className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: labelColor }}
          />
        );
        break;
      case "created_by":
        const member = members?.find((member) => member.member.id === groupTitle)?.member;
        icon = <Avatar user={member} height="24px" width="24px" fontSize="12px" />;

        break;
    }

    return icon;
  };

  return (
    <div
      className={`flex items-center justify-between px-1 ${
        !isCollapsed ? "flex-col rounded-md bg-brand-surface-1" : ""
      }`}
    >
      <div className={`flex items-center ${!isCollapsed ? "flex-col gap-2" : "gap-1"}`}>
        <div
          className={`flex cursor-pointer items-center gap-x-3 ${
            !isCollapsed ? "mb-2 flex-col gap-y-2 py-2" : ""
          }`}
        >
          <span className="flex items-center">{getGroupIcon()}</span>
          <h2
            className="text-lg font-semibold capitalize"
            style={{
              writingMode: !isCollapsed ? "vertical-rl" : "horizontal-tb",
            }}
          >
            {getGroupTitle()}
          </h2>
          <span
            className={`${
              isCollapsed ? "ml-0.5" : ""
            } min-w-[2.5rem] rounded-full bg-brand-surface-2 py-1 text-center text-xs`}
          >
            {groupedByIssues?.[groupTitle].length ?? 0}
          </span>
        </div>
      </div>

      <div className={`flex items-center ${!isCollapsed ? "flex-col pb-2" : ""}`}>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded p-1 text-brand-secondary outline-none duration-300 hover:bg-brand-surface-2"
          onClick={() => {
            setIsCollapsed((prevData) => !prevData);
          }}
        >
          {isCollapsed ? (
            <ArrowsPointingInIcon className="h-4 w-4" />
          ) : (
            <ArrowsPointingOutIcon className="h-4 w-4" />
          )}
        </button>
        {!isCompleted && selectedGroup !== "created_by" && (
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded p-1 text-brand-secondary outline-none duration-300 hover:bg-brand-surface-2"
            onClick={addIssueToState}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
