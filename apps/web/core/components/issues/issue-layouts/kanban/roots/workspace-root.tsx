import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueFilterType, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes, EIssueServiceType } from "@plane/types";
// components
import { AllIssueQuickActions } from "../../quick-action-dropdowns";
import { DeleteIssueModal } from "../../../delete-issue-modal";
import { IssueLayoutHOC } from "../../issue-layout-HOC";
import type { TRenderQuickActions } from "../../list/list-view-types";
import { getSourceFromDropPayload } from "../../utils";
import { KanBan } from "../default";
import { KanBanSwimLanes } from "../swimlanes";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useKanbanView } from "@/hooks/store/use-kanban-view";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useGroupIssuesDragNDrop } from "@/hooks/use-group-dragndrop";
import { useIssuesActions } from "@/hooks/use-issues-actions";

type Props = {
  isDefaultView: boolean;
  globalViewId: string;
};

export const WorkspaceKanBanRoot = observer(function WorkspaceKanBanRoot(props: Props) {
  const { globalViewId: _globalViewId } = props;

  // router
  const { workspaceSlug } = useParams();

  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { issueMap, issuesFilter, issues } = useIssues(EIssuesStoreType.GLOBAL);
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.ISSUES);
  const { fetchNextIssues, quickAddIssue, updateIssue, removeIssue, archiveIssue, updateFilters } =
    useIssuesActions(EIssuesStoreType.GLOBAL);
  const { joinedProjectIds } = useProject();

  const deleteAreaRef = useRef<HTMLDivElement | null>(null);
  const [isDragOverDelete, setIsDragOverDelete] = useState(false);

  const { isDragging } = useKanbanView();

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const sub_group_by = displayFilters?.sub_group_by;
  const group_by = displayFilters?.group_by;
  const orderBy = displayFilters?.order_by;

  // Note: We don't fetch issues here - the parent component (all-issue-layout-root.tsx) handles initial fetch
  // and the filter store handles fetches when layout/group_by changes. This prevents race conditions.

  const fetchMoreIssues = useCallback(
    (groupId?: string, subgroupId?: string) => {
      if (issues?.getIssueLoader(groupId, subgroupId) !== "pagination") {
        void fetchNextIssues(groupId, subgroupId);
      }
    },
    [fetchNextIssues, issues]
  );

  const groupedIssueIds = issues?.groupedIssueIds;

  const userDisplayFilters = displayFilters || null;

  const KanBanView = sub_group_by ? KanBanSwimLanes : KanBan;

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};

  // Check if user can create issues in at least one project (computed once per render)
  const canCreateIssues = useMemo(() => {
    if (!joinedProjectIds || joinedProjectIds.length === 0) return false;
    return joinedProjectIds.some((projectId) =>
      allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug?.toString(),
        projectId
      )
    );
  }, [joinedProjectIds, allowPermissions, workspaceSlug]);

  // Quick add callback that wraps the quickAddIssue action
  const handleQuickAddIssue = useCallback(
    async (projectId: string | null | undefined, data: TIssue) => {
      if (!projectId || !quickAddIssue) return;
      return await quickAddIssue(projectId, data);
    },
    [quickAddIssue]
  );

  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  // states
  const [draggedIssueId, setDraggedIssueId] = useState<string | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  // Permission callback for per-project permission check
  const canEditPropertiesBasedOnProject = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;
      return allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug?.toString(),
        projectId
      );
    },
    [allowPermissions, workspaceSlug]
  );

  const handleOnDrop = useGroupIssuesDragNDrop(EIssuesStoreType.GLOBAL, orderBy, group_by, sub_group_by);

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      const isEditingAllowedBasedOnProject = canEditPropertiesBasedOnProject(projectId);
      return enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing]
  );

  // Enable Auto Scroll for Main Kanban
  useEffect(() => {
    const element = scrollableContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, []);

  // Make the Issue Delete Box a Drop Target
  useEffect(() => {
    const element = deleteAreaRef.current;

    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ columnId: "issue-trash-box", groupId: "issue-trash-box", type: "DELETE" }),
        onDragEnter: () => {
          setIsDragOverDelete(true);
        },
        onDragLeave: () => {
          setIsDragOverDelete(false);
        },
        onDrop: (payload) => {
          setIsDragOverDelete(false);
          const source = getSourceFromDropPayload(payload);

          if (!source) return;

          setDraggedIssueId(source.id);
          setDeleteIssueModal(true);
        },
      })
    );
  }, [setIsDragOverDelete, setDraggedIssueId, setDeleteIssueModal]);

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton }) => (
      <AllIssueQuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        readOnly={!canEditProperties(issue.project_id ?? undefined)}
      />
    ),
    [canEditProperties, removeIssue, updateIssue, archiveIssue]
  );

  const handleDeleteIssue = async () => {
    const draggedIssue = getIssueById(draggedIssueId ?? "");

    if (!draggedIssueId || !draggedIssue) return;

    await removeIssue(draggedIssue.project_id, draggedIssueId).finally(() => {
      setDeleteIssueModal(false);
      setDraggedIssueId(undefined);
    });
  };

  const handleCollapsedGroups = useCallback(
    (toggle: "group_by" | "sub_group_by", value: string) => {
      if (workspaceSlug) {
        const currentGroups = issuesFilter?.issueFilters?.kanbanFilters?.[toggle] || [];
        const collapsedGroups = currentGroups.includes(value)
          ? currentGroups.filter((_value) => _value != value)
          : [...currentGroups, value];
        // projectId is not used for workspace-level filters
        void updateFilters("", EIssueFilterType.KANBAN_FILTERS, {
          [toggle]: collapsedGroups,
        });
      }
    },
    [workspaceSlug, issuesFilter, updateFilters]
  );

  const collapsedGroups = issuesFilter?.issueFilters?.kanbanFilters || { group_by: [], sub_group_by: [] };

  return (
    <>
      <DeleteIssueModal
        dataId={draggedIssueId}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDeleteIssue}
        isEpic={false}
      />
      {/* drag and delete component */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 ${
          isDragging ? "z-40" : ""
        } top-3 mx-3 flex w-72 items-center justify-center`}
        ref={deleteAreaRef}
      >
        <div
          className={`${
            isDragging ? `opacity-100` : `opacity-0`
          } flex w-full items-center justify-center rounded-sm border-2 border-danger-strong/20 bg-surface-1 px-3 py-5 text-11 font-medium italic text-danger-primary ${
            isDragOverDelete ? "bg-danger-primary blur-2xl" : ""
          } transition duration-300`}
        >
          Drop here to delete the work item.
        </div>
      </div>
      <IssueLayoutHOC layout={EIssueLayoutTypes.KANBAN}>
        <div
          className={`horizontal-scrollbar scrollbar-lg relative flex h-full w-full bg-surface-2 ${sub_group_by ? "vertical-scrollbar overflow-y-auto" : "overflow-x-auto overflow-y-hidden"}`}
          ref={scrollableContainerRef}
        >
          <div className="relative h-full w-max min-w-full bg-surface-2">
            <div className="h-full w-max">
              <KanBanView
                issuesMap={issueMap}
                groupedIssueIds={groupedIssueIds ?? {}}
                getGroupIssueCount={issues.getGroupIssueCount}
                displayProperties={displayProperties}
                sub_group_by={sub_group_by}
                group_by={group_by}
                orderBy={orderBy}
                updateIssue={updateIssue}
                quickActions={renderQuickActions}
                handleCollapsedGroups={handleCollapsedGroups}
                collapsedGroups={collapsedGroups}
                enableQuickIssueCreate={enableQuickAdd && canCreateIssues}
                showEmptyGroup={userDisplayFilters?.show_empty_groups ?? true}
                quickAddCallback={handleQuickAddIssue}
                disableIssueCreation={!enableIssueCreation || !canCreateIssues}
                canEditProperties={canEditProperties}
                // Workspace views are filter-based, not container-based like cycles/modules.
                // Issues appear based on their properties, not by being explicitly added to a view.
                addIssuesToView={undefined}
                scrollableContainerRef={scrollableContainerRef}
                handleOnDrop={handleOnDrop}
                loadMoreIssues={fetchMoreIssues}
                isEpic={false}
              />
            </div>
          </div>
        </div>
      </IssueLayoutHOC>
    </>
  );
});
