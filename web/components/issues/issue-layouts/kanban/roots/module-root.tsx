import React, { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { DragDropContext } from "@hello-pangea/dnd";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanSwimLanes } from "../swimlanes";
import { KanBan } from "../default";
import { ModuleIssueQuickActions } from "components/issues";
import { Spinner } from "@plane/ui";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;
  // store
  const {
    project: projectStore,
    projectMember: { projectMembers },
    projectState: projectStateStore,
    moduleIssue: moduleIssueStore,
    issueFilter: issueFilterStore,
    moduleIssueKanBanView: moduleIssueKanBanViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const issues = moduleIssueStore?.getIssues;

  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const order_by: string | null = issueFilterStore?.userDisplayFilters?.order_by || null;

  const userDisplayFilters = issueFilterStore?.userDisplayFilters || null;

  const displayProperties = issueFilterStore?.userDisplayProperties || null;

  const currentKanBanView: "swimlanes" | "default" = issueFilterStore?.userDisplayFilters?.sub_group_by
    ? "swimlanes"
    : "default";

  const [isDragStarted, setIsDragStarted] = useState<boolean>(false);

  // const onDragStart = () => {
  //   setIsDragStarted(true);
  // };

  const onDragEnd = (result: any) => {
    setIsDragStarted(false);
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

  const states = projectStateStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects[workspaceSlug.toString()] || null : null;
  // const estimates =
  //   currentProjectDetails?.estimate !== null
  //     ? projectStore.projectEstimates?.find((e) => e.id === currentProjectDetails?.estimate) || null
  //     : null;

  return (
    <>
      {moduleIssueStore.loader ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <div className={`relative min-w-full min-h-full h-max bg-custom-background-90 px-3 horizontal-scroll-enable`}>
          <DragDropContext onDragEnd={onDragEnd}>
            {currentKanBanView === "default" ? (
              <KanBan
                issues={issues}
                sub_group_by={sub_group_by}
                group_by={group_by}
                order_by={order_by}
                handleIssues={handleIssues}
                quickActions={(sub_group_by, group_by, issue) => (
                  <ModuleIssueQuickActions
                    issue={issue}
                    handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                    handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
                    handleRemoveFromModule={async () => handleIssues(sub_group_by, group_by, issue, "remove")}
                  />
                )}
                displayProperties={displayProperties}
                kanBanToggle={moduleIssueKanBanViewStore?.kanBanToggle}
                handleKanBanToggle={handleKanBanToggle}
                states={states}
                stateGroups={stateGroups}
                priorities={priorities}
                labels={labels}
                members={projectMembers?.map((m) => m.member) ?? null}
                projects={projects}
                showEmptyGroup={userDisplayFilters?.show_empty_groups || true}
                isDragStarted={isDragStarted}
              />
            ) : (
              <KanBanSwimLanes
                issues={issues}
                sub_group_by={sub_group_by}
                group_by={group_by}
                order_by={order_by}
                handleIssues={handleIssues}
                quickActions={(sub_group_by, group_by, issue) => (
                  <ModuleIssueQuickActions
                    issue={issue}
                    handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                    handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
                    handleRemoveFromModule={async () => handleIssues(sub_group_by, group_by, issue, "remove")}
                  />
                )}
                displayProperties={displayProperties}
                kanBanToggle={moduleIssueKanBanViewStore?.kanBanToggle}
                handleKanBanToggle={handleKanBanToggle}
                states={states}
                stateGroups={stateGroups}
                priorities={priorities}
                labels={labels}
                members={projectMembers?.map((m) => m.member) ?? null}
                projects={projects}
                showEmptyGroup={userDisplayFilters?.show_empty_groups || true}
                isDragStarted={isDragStarted}
              />
            )}
          </DragDropContext>
        </div>
      )}
    </>
  );
});
