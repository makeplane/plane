import { useCallback } from "react";
import { useRouter } from "next/router";
import { DragDropContext } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { KanBanSwimLanes } from "../swimlanes";
import { KanBan } from "../default";
import { DraftIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export const DraftIssueKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    project: projectStore,
    draftIssueFilters: draftIssueFiltersStore,
    issueKanBanView: issueKanBanViewStore,
    draftIssues: draftIssuesStore,
  } = useMobxStore();

  // derived values
  const issues = draftIssuesStore.getDraftIssues;
  const display_properties = draftIssueFiltersStore?.userDisplayProperties;
  const userDisplayFilters = draftIssueFiltersStore?.userDisplayFilters;
  const group_by: string | null = userDisplayFilters?.group_by || null;
  const showEmptyGroup = userDisplayFilters?.show_empty_groups || false;
  const sub_group_by: string | null = userDisplayFilters?.sub_group_by || null;

  const currentKanBanView = "default";

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
      ? issueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : issueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  const handleIssues = useCallback(
    (
      sub_group_by: string | null,
      group_by: string | null,
      issue: IIssue,
      action: "update" | "delete" | "convertToIssue"
    ) => {
      if (!workspaceSlug) return;

      if (action === "update") {
        draftIssuesStore.updateDraftIssue(workspaceSlug.toString(), issue.project, issue);
        draftIssuesStore.updateIssueStructure(group_by, sub_group_by, issue);
      }
      if (action === "delete") draftIssuesStore.deleteDraftIssue(workspaceSlug.toString(), issue.project, issue.id);
      if (action === "convertToIssue")
        draftIssuesStore.convertDraftIssueToIssue(workspaceSlug.toString(), issue.project, issue.id);
      draftIssuesStore.fetchIssues(workspaceSlug.toString(), issue.project);
    },
    [draftIssuesStore, workspaceSlug]
  );

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    issueKanBanViewStore.handleKanBanToggle(toggle, value);
  };

  const states = projectStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const labels = projectStore?.projectLabels || null;
  const members = projectStore?.projectMembers || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;
  const projects = workspaceSlug ? projectStore?.projects[workspaceSlug.toString()] || null : null;
  const orderBy = draftIssueFiltersStore?.userDisplayFilters?.order_by || null;

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
              <DraftIssueQuickActions
                issue={issue}
                handleUpdate={(issue: any, action: any) => handleIssues(sub_group_by, group_by, issue, action)}
              />
            )}
            displayProperties={display_properties}
            kanBanToggle={issueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            stateGroups={stateGroups}
            order_by={orderBy}
            priorities={priorities}
            labels={labels}
            members={members?.map((m) => m.member) ?? null}
            projects={projects}
            showEmptyGroup={showEmptyGroup}
          />
        ) : (
          <KanBanSwimLanes
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            order_by={orderBy}
            handleIssues={handleIssues}
            quickActions={(sub_group_by, group_by, issue) => (
              <DraftIssueQuickActions
                issue={issue}
                handleUpdate={(issue: any, action: any) => handleIssues(sub_group_by, group_by, issue, action)}
              />
            )}
            displayProperties={display_properties}
            kanBanToggle={issueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            states={states}
            stateGroups={stateGroups}
            priorities={priorities}
            labels={labels}
            members={members?.map((m) => m.member) ?? null}
            projects={projects}
            showEmptyGroup={showEmptyGroup}
          />
        )}
      </DragDropContext>
    </div>
  );
});
