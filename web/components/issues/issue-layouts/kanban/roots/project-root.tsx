import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { DragDropContext } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanSwimLanes } from "../swimlanes";
import { KanBan } from "../default";
import { ProjectIssueQuickActions } from "components/issues";
import { Spinner } from "@plane/ui";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export interface IKanBanLayout {}

export const KanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query as { workspaceSlug: string };

  const {
    project: projectStore,
    issue: issueStore,
    issueFilter: issueFilterStore,
    issueKanBanView: issueKanBanViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();
  const { currentProjectDetails } = projectStore;

  const issues = issueStore?.getIssues;

  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const order_by: string | null = issueFilterStore?.userDisplayFilters?.order_by || null;

  const userDisplayFilters = issueFilterStore?.userDisplayFilters || null;

  const displayProperties = issueFilterStore?.userDisplayProperties || null;

  const currentKanBanView: "swimlanes" | "default" = issueFilterStore?.userDisplayFilters?.sub_group_by
    ? "swimlanes"
    : "default";

  const [isDragStarted, setIsDragStarted] = useState<boolean>(false);

  const onDragStart = () => {
    setIsDragStarted(true);
  };

  const onDragEnd = (result: any) => {
    setIsDragStarted(false);

    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.source.droppableId &&
      result.destination.droppableId &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    currentKanBanView === "default"
      ? issueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : issueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  const handleIssues = useCallback(
    (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: "update" | "delete") => {
      if (!workspaceSlug) return;

      if (action === "update") {
        issueStore.updateIssueStructure(group_by, sub_group_by, issue);
        issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
      }
      if (action === "delete") issueStore.deleteIssue(group_by, sub_group_by, issue);
    },
    [issueStore, issueDetailStore, workspaceSlug]
  );

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    issueKanBanViewStore.handleKanBanToggle(toggle, value);
  };

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects?.[workspaceSlug] || null : null;
  const estimates =
    currentProjectDetails?.estimate !== null
      ? projectStore.projectEstimates?.find((e) => e.id === currentProjectDetails?.estimate) || null
      : null;

  return (
    <>
      {issueStore.loader ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90 px-3`}>
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            {currentKanBanView === "default" ? (
              <KanBan
                issues={issues}
                sub_group_by={sub_group_by}
                group_by={group_by}
                order_by={order_by}
                handleIssues={handleIssues}
                quickActions={(sub_group_by, group_by, issue) => (
                  <ProjectIssueQuickActions
                    issue={issue}
                    handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                    handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
                  />
                )}
                displayProperties={displayProperties}
                kanBanToggle={issueKanBanViewStore?.kanBanToggle}
                handleKanBanToggle={handleKanBanToggle}
                states={states}
                stateGroups={stateGroups}
                priorities={priorities}
                labels={labels}
                members={members?.map((m) => m.member) ?? null}
                projects={projects}
                enableQuickIssueCreate
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
                  <ProjectIssueQuickActions
                    issue={issue}
                    handleDelete={async () => handleIssues(sub_group_by, group_by, issue, "delete")}
                    handleUpdate={async (data) => handleIssues(sub_group_by, group_by, data, "update")}
                  />
                )}
                displayProperties={displayProperties}
                kanBanToggle={issueKanBanViewStore?.kanBanToggle}
                handleKanBanToggle={handleKanBanToggle}
                states={states}
                stateGroups={stateGroups}
                priorities={priorities}
                labels={labels}
                members={members?.map((m) => m.member) ?? null}
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
