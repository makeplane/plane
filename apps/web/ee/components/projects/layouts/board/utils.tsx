// "states" | "state_groups" | "priority" | "created_by";

import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { IWorkspace, IWorkspaceMember } from "@plane/types";
import { PriorityIcon } from "@plane/propel/icons";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { ProjectStateIcon } from "@/plane-web/components/workspace-project-states";
import { PROJECT_PRIORITY_MAP } from "@/plane-web/constants/project";
import { WORKSPACE_PROJECT_STATE_GROUPS } from "@/plane-web/constants/workspace-project-states";
import { GroupDetails, TProjectPriority } from "@/plane-web/types/workspace-project-filters";
import { EProjectStateGroup, TProjectState, TProjectStateGroupKey } from "@/plane-web/types/workspace-project-states";

const HIGHLIGHT_CLASS = "highlight";
const HIGHLIGHT_WITH_LINE = "highlight-with-line";

export const highlightProjectOnDrop = (
  elementId: string | undefined,
  shouldScrollIntoView = true,
  shouldHighLightWithLine = false
) => {
  setTimeout(async () => {
    const sourceElementId = elementId ?? "";
    const sourceElement = document.getElementById(sourceElementId);
    sourceElement?.classList?.add(shouldHighLightWithLine ? HIGHLIGHT_WITH_LINE : HIGHLIGHT_CLASS);
    if (shouldScrollIntoView && sourceElement)
      await smoothScrollIntoView(sourceElement, { behavior: "smooth", block: "center", duration: 1500 });
    setTimeout(() => {
      sourceElement?.classList?.remove(shouldHighLightWithLine ? HIGHLIGHT_WITH_LINE : HIGHLIGHT_CLASS);
    }, 2000);
  }, 200);
};
export const groupDetails = (
  getProjectStateById: (projectStateId: string) => TProjectState | undefined,
  getProjectStatedByStateGroupKey: (
    workspaceId: string,
    groupKey: TProjectStateGroupKey
  ) => TProjectState[] | undefined,
  getWorkspaceMemberDetails: (workspaceMemberId: string) => IWorkspaceMember | null,
  groupByKey: string,
  currentWorkspace: IWorkspace | null,
  selectedGroupKey: string | undefined
): GroupDetails | undefined => {
  switch (selectedGroupKey) {
    case "states": {
      const state = getProjectStateById(groupByKey);
      const groupKey = state?.group;
      return {
        title: state?.name || "State",
        icon: <ProjectStateIcon projectStateGroup={groupKey} width="14" height="14" />,
        prePopulatedPayload: {
          state_id: state && state?.id,
        },
      };
    }
    case "state_groups": {
      const groupKey = groupByKey as TProjectStateGroupKey;
      const stateGroup = WORKSPACE_PROJECT_STATE_GROUPS[groupKey];
      const states =
        currentWorkspace && getProjectStatedByStateGroupKey(currentWorkspace.id, groupByKey as EProjectStateGroup);
      return {
        title: stateGroup?.title || "State Group",
        icon: <ProjectStateIcon projectStateGroup={groupKey} width="14" height="14" />,
        prePopulatedPayload: {
          state_id: states && states.length > 0 && states[0].id,
        },
      };
    }
    case "priority": {
      const priorityKey = groupByKey as TProjectPriority;
      const priority = PROJECT_PRIORITY_MAP[priorityKey];
      return {
        title: priority?.label || "Priority",
        icon: <PriorityIcon priority={priority.key} className={`h-4 w-4`} />,
        prePopulatedPayload: {
          priority: priority.key,
        },
      };
    }
    case "created_by": {
      const member = getWorkspaceMemberDetails(groupByKey);
      if (!member?.member) return { title: "Created By", icon: <></>, prePopulatedPayload: {} };
      const memberDetails = member?.member;
      return {
        title: memberDetails?.display_name || "Created By",
        icon: memberDetails ? (
          <Avatar
            name={memberDetails.display_name}
            src={getFileURL(memberDetails.avatar_url)}
            showTooltip={false}
            size="md"
          />
        ) : (
          <></>
        ),
        prePopulatedPayload: {},
      };
    }
  }
};
