import { MutableRefObject } from "react";
import { observer } from "mobx-react";
//types
import { TIssue, IIssueDisplayProperties, IIssueMap } from "@plane/types";
import { KanbanIssueBlock } from "@/components/issues";
import { TRenderQuickActions } from "../list/list-view-types";
// components

interface IssueBlocksListProps {
  sub_group_id: string;
  groupId: string;
  issuesMap: IIssueMap;
  issueIds: string[];
  displayProperties: IIssueDisplayProperties | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  canDropOverIssue: boolean;
  canDragIssuesInCurrentGrouping: boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isEpic?: boolean;
}

export const KanbanIssueBlocksList: React.FC<IssueBlocksListProps> = observer((props) => {
  const {
    sub_group_id,
    groupId,
    issuesMap,
    issueIds,
    displayProperties,
    canDropOverIssue,
    canDragIssuesInCurrentGrouping,
    updateIssue,
    quickActions,
    canEditProperties,
    scrollableContainerRef,
    isEpic = false,
  } = props;

  return (
    <>
      {issueIds && issueIds.length > 0 ? (
        <>
          {issueIds.map((issueId, index) => {
            if (!issueId) return null;

            let draggableId = issueId;
            if (groupId) draggableId = `${draggableId}__${groupId}`;
            if (sub_group_id) draggableId = `${draggableId}__${sub_group_id}`;

            return (
              <KanbanIssueBlock
                key={draggableId}
                issueId={issueId}
                groupId={groupId}
                subGroupId={sub_group_id}
                shouldRenderByDefault={index <= 10}
                issuesMap={issuesMap}
                displayProperties={displayProperties}
                updateIssue={updateIssue}
                quickActions={quickActions}
                draggableId={draggableId}
                canDropOverIssue={canDropOverIssue}
                canDragIssuesInCurrentGrouping={canDragIssuesInCurrentGrouping}
                canEditProperties={canEditProperties}
                scrollableContainerRef={scrollableContainerRef}
                isEpic={isEpic}
              />
            );
          })}
        </>
      ) : null}
    </>
  );
});
