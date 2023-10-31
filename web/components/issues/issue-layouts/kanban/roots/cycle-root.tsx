import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanSwimLanes } from "../swimlanes";
import { KanBan } from "../default";
import { CycleIssueQuickActions } from "components/issues";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface ICycleKanBanLayout {}

export const CycleKanBanLayout: React.FC = observer(() => {
  const {
    project: projectStore,
    cycleIssue: cycleIssueStore,
    issueFilter: issueFilterStore,
    cycleIssueKanBanView: cycleIssueKanBanViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const issues = cycleIssueStore?.getIssues;

  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const displayProperties = issueFilterStore?.userDisplayProperties || null;

  const currentKanBanView: "swimlanes" | "default" = issueFilterStore?.userDisplayFilters?.sub_group_by
    ? "swimlanes"
    : "default";

  const onDragEnd = (result: any) => {
    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    currentKanBanView === "default"
      ? cycleIssueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : cycleIssueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  const handleIssues = useCallback(
    (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: "update" | "delete" | "remove") => {
      if (!workspaceSlug || !cycleId) return;

      if (action === "update") {
        cycleIssueStore.updateIssueStructure(group_by, sub_group_by, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") cycleIssueStore.deleteIssue(group_by, sub_group_by, issue);
      if (action === "remove" && issue.bridge_id) {
        cycleIssueStore.deleteIssue(group_by, sub_group_by, issue);
        cycleIssueStore.removeIssueFromCycle(
          workspaceSlug.toString(),
          issue.project,
          cycleId.toString(),
          issue.bridge_id
        );
      }
    },
    [cycleIssueStore, issueDetailStore, cycleId, workspaceSlug]
  );

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    cycleIssueKanBanViewStore.handleKanBanToggle(toggle, value);
  };

  const projectDetails = projectId ? projectStore.project_details[projectId.toString()] : null;

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects[workspaceSlug.toString()] || null : null;
  const estimates =
    projectDetails?.estimate !== null
      ? projectStore.projectEstimates?.find((e) => e.id === projectDetails?.estimate) || null
      : null;

  return (
    <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90 px-3`}>
      <DragDropContext onDragEnd={onDragEnd}>
        {currentKanBanView === "default" ? (
          <KanBan
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={handleIssues}
            quickActions={(sub_group_by, group_by, issue) => (
              <CycleIssueQuickActions
                issue={issue}
                handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
                handleRemoveFromCycle={async () => handleIssues(sub_group_by, group_by, issue, "remove")}
              />
            )}
            displayProperties={displayProperties}
            kanBanToggle={cycleIssueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members?.map((m) => m.member) ?? null}
            projects={projects}
            estimates={estimates?.points ? orderArrayBy(estimates.points, "key") : null}
          />
        ) : (
          <KanBanSwimLanes
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={handleIssues}
            quickActions={(sub_group_by, group_by, issue) => (
              <CycleIssueQuickActions
                issue={issue}
                handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
                handleRemoveFromCycle={async () => handleIssues(sub_group_by, group_by, issue, "remove")}
              />
            )}
            displayProperties={displayProperties}
            kanBanToggle={cycleIssueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members?.map((m) => m.member) ?? null}
            projects={projects}
            estimates={estimates?.points ? orderArrayBy(estimates.points, "key") : null}
          />
        )}
      </DragDropContext>
    </div>
  );
});
