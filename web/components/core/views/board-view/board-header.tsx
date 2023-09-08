import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
import projectService from "services/project.service";
// hooks
import useProjects from "hooks/use-projects";
// component
import { Avatar, Icon } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { StateGroupIcon, getPriorityIcon } from "components/icons";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IIssueViewProps, IState, TStateGroups } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS } from "constants/fetch-keys";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

type Props = {
  currentState?: IState | null;
  groupTitle: string;
  addIssueToGroup: () => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  disableUserActions: boolean;
  disableAddIssue: boolean;
  viewProps: IIssueViewProps;
};

export const BoardHeader: React.FC<Props> = ({
  currentState,
  groupTitle,
  addIssueToGroup,
  isCollapsed,
  setIsCollapsed,
  disableUserActions,
  disableAddIssue,
  viewProps,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { groupedIssues, groupByProperty: selectedGroup } = viewProps;

  const { data: issueLabels } = useSWR(
    workspaceSlug && projectId && selectedGroup === "labels"
      ? PROJECT_ISSUE_LABELS(projectId.toString())
      : null,
    workspaceSlug && projectId && selectedGroup === "labels"
      ? () => issuesService.getIssueLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const { data: members } = useSWR(
    workspaceSlug && projectId && (selectedGroup === "created_by" || selectedGroup === "assignees")
      ? PROJECT_MEMBERS(projectId.toString())
      : null,
    workspaceSlug && projectId && (selectedGroup === "created_by" || selectedGroup === "assignees")
      ? () => projectService.projectMembers(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const { projects } = useProjects();

  const getGroupTitle = () => {
    let title = addSpaceIfCamelCase(groupTitle);

    switch (selectedGroup) {
      case "state":
        title = addSpaceIfCamelCase(currentState?.name ?? "");
        break;
      case "labels":
        title = issueLabels?.find((label) => label.id === groupTitle)?.name ?? "None";
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

    switch (selectedGroup) {
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
        icon = getPriorityIcon(groupTitle, "text-lg");
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
          issueLabels?.find((label) => label.id === groupTitle)?.color ?? "#000000";
        icon = (
          <span
            className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
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

  return (
    <div
      className={`flex items-center justify-between px-1 ${
        !isCollapsed ? "flex-col rounded-md bg-custom-background-90" : ""
      }`}
    >
      <div className={`flex items-center ${isCollapsed ? "gap-1" : "flex-col gap-2"}`}>
        <div
          className={`flex cursor-pointer items-center gap-x-2 max-w-[316px] ${
            !isCollapsed ? "mb-2 flex-col gap-y-2 py-2" : ""
          }`}
        >
          <span className="flex items-center">{getGroupIcon()}</span>
          <h2
            className={`text-lg font-semibold truncate ${
              selectedGroup === "created_by" ? "" : "capitalize"
            }`}
            style={{
              writingMode: isCollapsed ? "horizontal-tb" : "vertical-rl",
            }}
          >
            {getGroupTitle()}
          </h2>
          <span className={`${isCollapsed ? "ml-0.5" : ""} py-1 text-center text-sm`}>
            {groupedIssues?.[groupTitle].length ?? 0}
          </span>
        </div>
      </div>

      <div className={`flex items-center ${!isCollapsed ? "flex-col pb-2" : ""}`}>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded p-1 text-custom-text-200 outline-none duration-300 hover:bg-custom-background-80"
          onClick={() => {
            setIsCollapsed((prevData) => !prevData);
          }}
        >
          {isCollapsed ? (
            <Icon
              iconName="close_fullscreen"
              className="text-base font-medium text-custom-text-900"
            />
          ) : (
            <Icon iconName="open_in_full" className="text-base font-medium text-custom-text-900" />
          )}
        </button>
        {!disableAddIssue && !disableUserActions && selectedGroup !== "created_by" && (
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded p-1 text-custom-text-200 outline-none duration-300 hover:bg-custom-background-80"
            onClick={addIssueToGroup}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
