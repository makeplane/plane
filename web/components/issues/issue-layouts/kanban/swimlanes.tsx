import { observer } from "mobx-react-lite";
// components
import { KanBan } from "./default";
import { HeaderSubGroupByCard } from "./headers/sub-group-by-card";
import { HeaderGroupByCard } from "./headers/group-by-card";
// types
import {
  GroupByColumnTypes,
  IGroupByColumn,
  IGroupedIssues,
  IIssue,
  IIssueDisplayProperties,
  IIssueMap,
  ISubGroupedIssues,
  TUnGroupedIssues,
} from "types";
// constants
import { EIssueActions } from "../types";
import { EProjectStore } from "store/application/command-palette.store";
import { useLabel, useProject, useProjectState } from "hooks/store";
import { getGroupByColumns } from "../utils";

interface ISubGroupSwimlaneHeader {
  issueIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues;
  sub_group_by: string | null;
  group_by: string | null;
  list: IGroupByColumn[];
  kanBanToggle: any;
  handleKanBanToggle: any;
}
const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = ({
  issueIds,
  sub_group_by,
  group_by,
  list,
  kanBanToggle,
  handleKanBanToggle,
}) => (
  <div className="relative flex h-max min-h-full w-full items-center">
    {list &&
      list.length > 0 &&
      list.map((_list: IGroupByColumn) => (
        <div key={`${sub_group_by}_${_list.id}`} className="flex w-[340px] flex-shrink-0 flex-col">
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={_list.id}
            icon={_list.Icon}
            title={_list.name}
            count={issueIds?.[_list.id]?.length || 0}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            issuePayload={_list.payload}
          />
        </div>
      ))}
  </div>
);

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  issuesMap: IIssueMap;
  issueIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues;
  showEmptyGroup: boolean;
  displayProperties: IIssueDisplayProperties;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanBanToggle: any;
  handleKanBanToggle: any;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  enableQuickIssueCreate: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
}
const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    sub_group_by,
    group_by,
    list,
    handleIssues,
    quickActions,
    displayProperties,
    kanBanToggle,
    handleKanBanToggle,
    showEmptyGroup,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
    viewId,
  } = props;

  const calculateIssueCount = (column_id: string) => {
    let issueCount = 0;
    issueIds?.[column_id] &&
      Object.keys(issueIds?.[column_id])?.forEach((_list: any) => {
        issueCount += issueIds?.[column_id]?.[_list]?.length || 0;
      });
    return issueCount;
  };

  return (
    <div className="relative h-max min-h-full w-full">
      {list &&
        list.length > 0 &&
        list.map((_list: any) => (
          <div className="flex flex-shrink-0 flex-col">
            <div className="sticky top-[50px] z-[1] flex w-full items-center bg-custom-background-90 py-1">
              <div className="sticky left-0 flex-shrink-0 bg-custom-background-90 pr-2">
                <HeaderSubGroupByCard
                  column_id={_list.id}
                  icon={_list.Icon}
                  title={_list.name || ""}
                  count={calculateIssueCount(_list.id)}
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                />
              </div>
              <div className="w-full border-b border-dashed border-custom-border-400" />
            </div>
            {!kanBanToggle?.subgroupByIssuesVisibility.includes(_list.id) && (
              <div className="relative">
                <KanBan
                  issuesMap={issuesMap}
                  issueIds={issueIds?.[_list.id]}
                  displayProperties={displayProperties}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  sub_group_id={_list.id}
                  handleIssues={handleIssues}
                  quickActions={quickActions}
                  kanBanToggle={kanBanToggle}
                  handleKanBanToggle={handleKanBanToggle}
                  showEmptyGroup={showEmptyGroup}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  canEditProperties={canEditProperties}
                  addIssuesToView={addIssuesToView}
                  quickAddCallback={quickAddCallback}
                  viewId={viewId}
                />
              </div>
            )}
          </div>
        ))}
    </div>
  );
});

export interface IKanBanSwimLanes {
  issuesMap: IIssueMap;
  issueIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties;
  sub_group_by: string | null;
  group_by: string | null;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  kanBanToggle: any;
  handleKanBanToggle: any;
  showEmptyGroup: boolean;
  isDragStarted?: boolean;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
  enableQuickIssueCreate: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    issuesMap,
    issueIds,
    displayProperties,
    sub_group_by,
    group_by,
    handleIssues,
    quickActions,
    kanBanToggle,
    handleKanBanToggle,
    showEmptyGroup,
    isDragStarted,
    disableIssueCreation,
    enableQuickIssueCreate,
    canEditProperties,
    addIssuesToView,
    quickAddCallback,
    viewId,
  } = props;

  const project = useProject();
  const projectLabel = useLabel();
  const projectState = useProjectState();

  const groupByList = getGroupByColumns(group_by as GroupByColumnTypes, project, projectLabel, projectState);
  const subGroupByList = getGroupByColumns(sub_group_by as GroupByColumnTypes, project, projectLabel, projectState);

  if (!groupByList || !subGroupByList) return null;

  return (
    <div className="relative">
      <div className="sticky top-0 z-[2] h-[50px] bg-custom-background-90">
        <SubGroupSwimlaneHeader
          issueIds={issueIds}
          group_by={group_by}
          sub_group_by={sub_group_by}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          list={groupByList}
        />
      </div>

      {sub_group_by && (
        <SubGroupSwimlane
          issuesMap={issuesMap}
          list={subGroupByList}
          issueIds={issueIds}
          displayProperties={displayProperties}
          group_by={group_by}
          sub_group_by={sub_group_by}
          handleIssues={handleIssues}
          quickActions={quickActions}
          kanBanToggle={kanBanToggle}
          handleKanBanToggle={handleKanBanToggle}
          showEmptyGroup={showEmptyGroup}
          isDragStarted={isDragStarted}
          disableIssueCreation={disableIssueCreation}
          enableQuickIssueCreate={enableQuickIssueCreate}
          addIssuesToView={addIssuesToView}
          canEditProperties={canEditProperties}
          quickAddCallback={quickAddCallback}
          viewId={viewId}
        />
      )}
    </div>
  );
});
