import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanSwimLanes } from "./swimlanes";
import { KanBan } from "./default";
import { ModuleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const {
    project: projectStore,
    moduleIssue: moduleIssueStore,
    issueFilter: issueFilterStore,
    moduleIssueKanBanView: moduleIssueKanBanViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;

  const issues = moduleIssueStore?.getIssues;

  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const display_properties = issueFilterStore?.userDisplayProperties || null;

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
      ? moduleIssueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : moduleIssueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  const handleIssues = useCallback(
    (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: "update" | "delete" | "remove") => {
      if (!workspaceSlug || !moduleId) return;

      if (action === "update") {
        moduleIssueStore.updateIssueStructure(group_by, sub_group_by, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") moduleIssueStore.deleteIssue(group_by, sub_group_by, issue);
      if (action === "remove" && issue.bridge_id) {
        moduleIssueStore.deleteIssue(group_by, null, issue);
        moduleIssueStore.removeIssueFromModule(
          workspaceSlug.toString(),
          issue.project,
          moduleId.toString(),
          issue.bridge_id
        );
      }
    },
    [moduleIssueStore, issueDetailStore, moduleId, workspaceSlug]
  );

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    moduleIssueKanBanViewStore.handleKanBanToggle(toggle, value);
  };

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = projectStore?.projectStates || null;
  const estimates = null;

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
              <ModuleIssueQuickActions
                issue={issue}
                handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
                handleRemoveFromModule={async () => handleIssues(sub_group_by, group_by, issue, "remove")}
              />
            )}
            display_properties={display_properties}
            kanBanToggle={moduleIssueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members}
            projects={projects}
            estimates={estimates}
          />
        ) : (
          <KanBanSwimLanes
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={handleIssues}
            quickActions={(sub_group_by, group_by, issue) => (
              <ModuleIssueQuickActions
                issue={issue}
                handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
                handleRemoveFromModule={async () => handleIssues(sub_group_by, group_by, issue, "remove")}
              />
            )}
            display_properties={display_properties}
            kanBanToggle={moduleIssueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members}
            projects={projects}
            estimates={estimates}
          />
        )}
      </DragDropContext>
    </div>
  );
});
