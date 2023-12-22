import { Droppable } from "@hello-pangea/dnd";
//types
import { IGroupedIssues, IIssue, IIssueDisplayProperties, IIssueMap, ISubGroupedIssues, TUnGroupedIssues } from "types";
import { EIssueActions } from "../types";
//components
import { KanBanQuickAddIssueForm, KanbanIssueBlocksList } from ".";

interface IKanbanGroup {
  groupId: string;
  issuesMap: IIssueMap;
  issueIds: IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: string | null;
  group_by: string | null;
  sub_group_id: string;
  isDragDisabled: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  verticalPosition: any;
}

export const KanbanGroup = (props: IKanbanGroup) => {
  const {
    groupId,
    sub_group_id,
    group_by,
    sub_group_by,
    issuesMap,
    displayProperties,
    verticalPosition,
    issueIds,
    isDragDisabled,
    handleIssues,
    quickActions,
    canEditProperties,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    viewId,
  } = props;

  return (
    <div className={`${verticalPosition ? `min-h-[150px] w-[0px] overflow-hidden` : `w-full transition-all`}`}>
      <Droppable droppableId={`${groupId}__${sub_group_id}`}>
        {(provided: any, snapshot: any) => (
          <div
            className={`relative h-full w-full transition-all ${
              snapshot.isDraggingOver ? `bg-custom-background-80` : ``
            }`}
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {!verticalPosition ? (
              <KanbanIssueBlocksList
                sub_group_id={sub_group_id}
                columnId={groupId}
                issuesMap={issuesMap}
                issueIds={(issueIds as IGroupedIssues)?.[groupId] || []}
                displayProperties={displayProperties}
                isDragDisabled={isDragDisabled}
                handleIssues={handleIssues}
                quickActions={quickActions}
                canEditProperties={canEditProperties}
              />
            ) : null}

            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="sticky bottom-0 z-[0] w-full flex-shrink-0 bg-custom-background-90 py-1">
        {enableQuickIssueCreate && !disableIssueCreation && (
          <KanBanQuickAddIssueForm
            formKey="name"
            groupId={groupId}
            subGroupId={sub_group_id}
            prePopulatedData={{
              ...(group_by && { [group_by]: groupId }),
              ...(sub_group_by && sub_group_id !== "null" && { [sub_group_by]: sub_group_id }),
            }}
            quickAddCallback={quickAddCallback}
            viewId={viewId}
          />
        )}
      </div>
    </div>
  );
};
