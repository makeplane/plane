import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-beautiful-dnd
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// services
import stateService from "services/project_state.service";
// hooks
import useUser from "hooks/use-user";
import { useProjectMyMembership } from "contexts/project-member.context";
// components
import { AllLists, AllBoards, CalendarView, SpreadsheetView, GanttChartView } from "components/core";
import { CalendarLayout, KanBanLayout } from "components/issues";
// ui
import { EmptyState, Spinner } from "components/ui";
// icons
import { TrashIcon } from "@heroicons/react/24/outline";
// images
import emptyIssue from "public/empty-state/issue.svg";
import emptyIssueArchive from "public/empty-state/issue-archive.svg";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { IIssue, IIssueViewProps } from "types";
// fetch-keys
import { STATES_LIST } from "constants/fetch-keys";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { observer } from "mobx-react-lite";

type Props = {
  addIssueToDate: (date: string) => void;
  addIssueToGroup: (groupTitle: string) => void;
  disableUserActions: boolean;
  dragDisabled?: boolean;
  emptyState: {
    title: string;
    description?: string;
    primaryButton?: {
      icon: any;
      text: string;
      onClick: () => void;
    };
    secondaryButton?: React.ReactNode;
  };
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleDraftIssueAction?: (issue: IIssue, action: "edit" | "delete") => void;
  handleOnDragEnd: (result: DropResult) => Promise<void>;
  openIssuesListModal: (() => void) | null;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  disableAddIssueOption?: boolean;
  trashBox: boolean;
  setTrashBox: React.Dispatch<React.SetStateAction<boolean>>;
  viewProps: IIssueViewProps;
};

export const AllViews: React.FC<Props> = observer(({ trashBox, setTrashBox }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
    moduleId: string;
  };

  const [myIssueProjectId, setMyIssueProjectId] = useState<string | null>(null);

  const { issue: issueStore, project: projectStore, issueFilter: issueFilterStore } = useMobxStore();

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug ? () => stateService.getStates(workspaceSlug as string, projectId as string) : null
  );
  const states = getStatesList(stateGroups);

  const handleMyIssueOpen = (issue: IIssue) => {
    setMyIssueProjectId(issue.project);
  };

  const handleTrashBox = useCallback(
    (isDragging: boolean) => {
      if (isDragging && !trashBox) setTrashBox(true);
    },
    [trashBox, setTrashBox]
  );

  useSWR(workspaceSlug && projectId ? `PROJECT_ISSUES` : null, async () => {
    if (workspaceSlug && projectId) {
      await issueFilterStore.fetchUserProjectFilters(workspaceSlug, projectId);

      await projectStore.fetchProjectStates(workspaceSlug, projectId);
      await projectStore.fetchProjectLabels(workspaceSlug, projectId);
      await projectStore.fetchProjectMembers(workspaceSlug, projectId);

      await issueStore.fetchIssues(workspaceSlug, projectId);
    }
  });

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  return (
    <div className="relative w-full h-full overflow-auto">
      {activeLayout === "kanban" ? <KanBanLayout /> : activeLayout === "calendar" ? <CalendarLayout /> : null}
    </div>
  );
});
