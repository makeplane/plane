import { MutableRefObject, memo } from "react";
//types
import { TIssue, IIssueDisplayProperties, IIssueMap } from "@plane/types";
import { KanbanIssueBlock } from "@/components/issues";
import { TRenderQuickActions } from "../list/list-view-types";
// components

interface IssueBlocksListProps {
  sub_group_id: string;
  columnId: string;
  issuesMap: IIssueMap;
  issueIds: string[];
  displayProperties: IIssueDisplayProperties | undefined;
  isDragDisabled: boolean;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
}

const KanbanIssueBlocksListMemo: React.FC<IssueBlocksListProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    issuesMap,
    issueIds,
    displayProperties,
    isDragDisabled,
    updateIssue,
    quickActions,
    canEditProperties,
    scrollableContainerRef,
  } = props;

  return (
    <>
      {issueIds && issueIds.length > 0 ? (
        <>
          {issueIds.map((issueId) => {
            if (!issueId) return null;

            let draggableId = issueId;
            if (columnId) draggableId = `${draggableId}__${columnId}`;
            if (sub_group_id) draggableId = `${draggableId}__${sub_group_id}`;

            return (
              <KanbanIssueBlock
                key={draggableId}
                issueId={issueId}
                issuesMap={issuesMap}
                displayProperties={displayProperties}
                updateIssue={updateIssue}
                quickActions={quickActions}
                draggableId={draggableId}
                isDragDisabled={isDragDisabled}
                canEditProperties={canEditProperties}
                scrollableContainerRef={scrollableContainerRef}
                issueIds={issueIds} //passing to force render for virtualization whenever parent rerenders
              />
            );
          })}
        </>
      ) : null}
    </>
  );
};

export const KanbanIssueBlocksList = memo(KanbanIssueBlocksListMemo);
