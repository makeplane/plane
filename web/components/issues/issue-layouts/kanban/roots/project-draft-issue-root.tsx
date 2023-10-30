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
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IIssue } from "types";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";

export const DraftIssueKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    project: projectStore,
    issueFilter: issueFilterStore,
    issueKanBanView: issueKanBanViewStore,
    draftIssues: draftIssuesStore,
  } = useMobxStore();

  const issues = draftIssuesStore.getDraftIssues;

  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const display_properties = issueFilterStore?.userDisplayProperties || null;

  const currentKanBanView = "default";
  // const currentKanBanView: "swimlanes" | "default" = issueFilterStore?.userDisplayFilters?.sub_group_by
  //   ? "swimlanes"
  //   : "default";

  const onDragEnd = (result: any) => {
    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    // TODO: use draft issue store instead
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
        draftIssuesStore.updateIssueStructure(group_by, sub_group_by, issue);
        draftIssuesStore.updateDraftIssue(workspaceSlug.toString(), issue.project, issue);
      }
      if (action === "delete") draftIssuesStore.deleteDraftIssue(workspaceSlug.toString(), issue.project, issue.id);
      if (action === "convertToIssue")
        draftIssuesStore.convertDraftIssueToIssue(workspaceSlug.toString(), issue.project, issue.id);
    },
    [draftIssuesStore, workspaceSlug]
  );

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    issueKanBanViewStore.handleKanBanToggle(toggle, value);
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
              <DraftIssueQuickActions
                issue={issue}
                handleUpdate={(issue: any, action: any) => handleIssues(sub_group_by, group_by, issue, action)}
              />
            )}
            display_properties={display_properties}
            kanBanToggle={issueKanBanViewStore?.kanBanToggle}
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
              <DraftIssueQuickActions
                issue={issue}
                handleUpdate={(issue: any, action: any) => handleIssues(sub_group_by, group_by, issue, action)}
              />
            )}
            display_properties={display_properties}
            kanBanToggle={issueKanBanViewStore?.kanBanToggle}
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
