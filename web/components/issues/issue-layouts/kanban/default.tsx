import { observer } from "mobx-react-lite";
// hooks
import { useKanbanView, useLabel, useMember, useProject, useProjectState } from "hooks/store";
// components
import { HeaderGroupByCard } from "./headers/group-by-card";
import { KanbanGroup } from "./kanban-group";
// types
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TUnGroupedIssues,
} from "@plane/types";
// constants
import { EIssueActions } from "../types";
import { getGroupByColumns } from "../utils";
import { TCreateModalStoreTypes } from "constants/issue";

export interface IGroupByKanBan {
  issuesMap: IIssueMap;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id: string;
  isDragDisabled: boolean;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanBanToggle: any;
  handleKanBanToggle: any;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  currentStore?: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
}

const GroupByKanBan: React.FC<IGroupByKanBan> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    displayProperties,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    isDragDisabled,
    handleIssues,
    quickActions,
    kanBanToggle,
    handleKanBanToggle,
    enableQuickIssueCreate,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    currentStore,
    addIssuesToView,
    canEditProperties,
  } = props;

  const member = useMember();
  const project = useProject();
  const projectLabel = useLabel();
  const projectState = useProjectState();

  const list = getGroupByColumns(group_by as GroupByColumnTypes, project, projectLabel, projectState, member);

  if (!list) return null;

  const verticalAlignPosition = (_list: IGroupByColumn) => kanBanToggle?.groupByHeaderMinMax.includes(_list.id);

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div className="relative flex h-full w-full gap-3">
      {list &&
        list.length > 0 &&
        list.map((_list: IGroupByColumn) => {
          const verticalPosition = verticalAlignPosition(_list);

          return (
            <div className={`relative flex flex-shrink-0 flex-col ${!verticalPosition ? `w-[340px]` : ``} group`}>
              {sub_group_by === null && (
                <div className="sticky top-0 z-[2] w-full flex-shrink-0 bg-custom-background-90 py-1">
                  <HeaderGroupByCard
                    sub_group_by={sub_group_by}
                    group_by={group_by}
                    column_id={_list.id}
                    icon={_list.Icon}
                    title={_list.name}
                    count={(issueIds as TGroupedIssues)?.[_list.id]?.length || 0}
                    kanBanToggle={kanBanToggle}
                    handleKanBanToggle={handleKanBanToggle}
                    issuePayload={_list.payload}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy}
                    currentStore={currentStore}
                    addIssuesToView={addIssuesToView}
                  />
                </div>
              )}
              <KanbanGroup
                groupId={_list.id}
                issuesMap={issuesMap}
                issueIds={issueIds}
                displayProperties={displayProperties}
                sub_group_by={sub_group_by}
                group_by={group_by}
                sub_group_id={sub_group_id}
                isDragDisabled={isDragDisabled}
                handleIssues={handleIssues}
                quickActions={quickActions}
                enableQuickIssueCreate={enableQuickIssueCreate}
                quickAddCallback={quickAddCallback}
                viewId={viewId}
                disableIssueCreation={disableIssueCreation}
                canEditProperties={canEditProperties}
                verticalPosition={verticalPosition}
              />
            </div>
          );
        })}
    </div>
  );
});

export interface IKanBan {
  issuesMap: IIssueMap;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id?: string;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanBanToggle: any;
  handleKanBanToggle: any;
  showEmptyGroup: boolean;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  currentStore?: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    displayProperties,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    handleIssues,
    quickActions,
    kanBanToggle,
    handleKanBanToggle,
    enableQuickIssueCreate,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    currentStore,
    addIssuesToView,
    canEditProperties,
  } = props;

  const issueKanBanView = useKanbanView();

  return (
    <div className="relative h-full w-full">
      <GroupByKanBan
        issuesMap={issuesMap}
        issueIds={issueIds}
        displayProperties={displayProperties}
        group_by={group_by}
        sub_group_by={sub_group_by}
        sub_group_id={sub_group_id}
        isDragDisabled={!issueKanBanView?.canUserDragDrop}
        handleIssues={handleIssues}
        quickActions={quickActions}
        kanBanToggle={kanBanToggle}
        handleKanBanToggle={handleKanBanToggle}
        enableQuickIssueCreate={enableQuickIssueCreate}
        quickAddCallback={quickAddCallback}
        viewId={viewId}
        disableIssueCreation={disableIssueCreation}
        currentStore={currentStore}
        addIssuesToView={addIssuesToView}
        canEditProperties={canEditProperties}
      />
    </div>
  );
});
