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
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
}

export const KanbanIssueBlocksList: React.FC<IssueBlocksListProps> = observer((props) => {
  const {
    sub_group_id,
    groupId,
    issuesMap,
    issueIds,
    displayProperties,
    canDropOverIssue,
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
            if (groupId) draggableId = `${draggableId}__${groupId}`;
            if (sub_group_id) draggableId = `${draggableId}__${sub_group_id}`;

            return (
              <KanbanIssueBlock
                key={draggableId}
                issueId={issueId}
                groupId={groupId}
                subGroupId={sub_group_id}
                issuesMap={issuesMap}
                displayProperties={displayProperties}
                updateIssue={updateIssue}
                quickActions={quickActions}
                draggableId={draggableId}
                canDropOverIssue={canDropOverIssue}
                canEditProperties={canEditProperties}
                scrollableContainerRef={scrollableContainerRef}
              />
            );
          })}
        </>
      ) : null}
    </>
  );
});
