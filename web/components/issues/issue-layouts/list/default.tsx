// components
import { IssueBlocksList, ListQuickAddIssueForm } from "components/issues";
// hooks
import { useLabel, useMember, useProject, useProjectState } from "hooks/store";
// types
import {
  GroupByColumnTypes,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TIssueMap,
  TUnGroupedIssues,
} from "@plane/types";
import { EIssueActions } from "../types";
// constants
import { HeaderGroupByCard } from "./headers/group-by-card";
import { getGroupByColumns } from "../utils";
import { TCreateModalStoreTypes } from "constants/issue";

export interface IGroupByList {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  group_by: string | null;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  storeType: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  viewId?: string;
}

const GroupByList: React.FC<IGroupByList> = (props) => {
  const {
    issueIds,
    issuesMap,
    group_by,
    handleIssues,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    showEmptyGroup,
    canEditProperties,
    quickAddCallback,
    viewId,
    disableIssueCreation,
    storeType,
    addIssuesToView,
  } = props;
  // store hooks
  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const projectState = useProjectState();

  const list = getGroupByColumns(group_by as GroupByColumnTypes, project, label, projectState, member, true);

  if (!list) return null;

  const prePopulateQuickAddData = (groupByKey: string | null, value: any) => {
    const defaultState = projectState.projectStates?.find((state) => state.default);
    let preloadedData: object = { state_id: defaultState?.id };

    if (groupByKey === null) {
      preloadedData = { ...preloadedData };
    } else {
      if (groupByKey === "state") {
        preloadedData = { ...preloadedData, state_id: value };
      } else if (groupByKey === "priority") {
        preloadedData = { ...preloadedData, priority: value };
      } else if (groupByKey === "labels" && value != "None") {
        preloadedData = { ...preloadedData, label_ids: [value] };
      } else if (groupByKey === "assignees" && value != "None") {
        preloadedData = { ...preloadedData, assignee_ids: [value] };
      } else if (groupByKey === "created_by") {
        preloadedData = { ...preloadedData };
      } else {
        preloadedData = { ...preloadedData, [groupByKey]: value };
      }
    }

    return preloadedData;
  };

  const validateEmptyIssueGroups = (issues: TIssue[]) => {
    const issuesCount = issues?.length || 0;
    if (!showEmptyGroup && issuesCount <= 0) return false;
    return true;
  };

  const is_list = group_by === null ? true : false;

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div className="relative h-full w-full">
      {list &&
        list.length > 0 &&
        list.map(
          (_list: any) =>
            validateEmptyIssueGroups(is_list ? issueIds : issueIds?.[_list.id]) && (
              <div key={_list.id} className={`flex flex-shrink-0 flex-col`}>
                <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-3 py-1">
                  <HeaderGroupByCard
                    icon={_list.icon}
                    title={_list.name || ""}
                    count={is_list ? issueIds?.length || 0 : issueIds?.[_list.id]?.length || 0}
                    issuePayload={_list.payload}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy}
                    storeType={storeType}
                    addIssuesToView={addIssuesToView}
                  />
                </div>

                {issueIds && (
                  <IssueBlocksList
                    issueIds={is_list ? issueIds || 0 : issueIds?.[_list.id] || 0}
                    issuesMap={issuesMap}
                    handleIssues={handleIssues}
                    quickActions={quickActions}
                    displayProperties={displayProperties}
                    canEditProperties={canEditProperties}
                  />
                )}

                {enableIssueQuickAdd && !disableIssueCreation && !isGroupByCreatedBy && (
                  <div className="sticky bottom-0 z-[1] w-full flex-shrink-0">
                    <ListQuickAddIssueForm
                      prePopulatedData={prePopulateQuickAddData(group_by, _list.id)}
                      quickAddCallback={quickAddCallback}
                      viewId={viewId}
                    />
                  </div>
                )}
              </div>
            )
        )}
    </div>
  );
};

export interface IList {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  group_by: string | null;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup: boolean;
  enableIssueQuickAdd: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  storeType: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
}

export const List: React.FC<IList> = (props) => {
  const {
    issueIds,
    issuesMap,
    group_by,
    handleIssues,
    quickActions,
    quickAddCallback,
    viewId,
    displayProperties,
    showEmptyGroup,
    enableIssueQuickAdd,
    canEditProperties,
    disableIssueCreation,
    storeType,
    addIssuesToView,
  } = props;

  return (
    <div className="relative h-full w-full">
      <GroupByList
        issueIds={issueIds as TUnGroupedIssues}
        issuesMap={issuesMap}
        group_by={group_by}
        handleIssues={handleIssues}
        quickActions={quickActions}
        displayProperties={displayProperties}
        enableIssueQuickAdd={enableIssueQuickAdd}
        showEmptyGroup={showEmptyGroup}
        canEditProperties={canEditProperties}
        quickAddCallback={quickAddCallback}
        viewId={viewId}
        disableIssueCreation={disableIssueCreation}
        storeType={storeType}
        addIssuesToView={addIssuesToView}
      />
    </div>
  );
};
