import type { MutableRefObject } from "react";
import { observer } from "mobx-react";
//types
import type { IIssueDisplayProperties } from "@plane/types";
// components
import { KanbanIssueBlock } from "./block";

interface IssueBlocksListProps {
  subGroupId: string;
  groupId: string;
  issueIds: string[];
  displayProperties: IIssueDisplayProperties | undefined;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
}

export const KanbanIssueBlocksList = observer(function KanbanIssueBlocksList(props: IssueBlocksListProps) {
  const { subGroupId, groupId, issueIds, displayProperties, scrollableContainerRef } = props;

  return (
    <>
      {issueIds && issueIds.length > 0
        ? issueIds.map((issueId) => {
            if (!issueId) return null;

            let draggableId = issueId;
            if (groupId) draggableId = `${draggableId}__${groupId}`;
            if (subGroupId) draggableId = `${draggableId}__${subGroupId}`;

            return (
              <KanbanIssueBlock
                key={draggableId}
                issueId={issueId}
                groupId={groupId}
                subGroupId={subGroupId}
                displayProperties={displayProperties}
                scrollableContainerRef={scrollableContainerRef}
              />
            );
          })
        : null}
    </>
  );
});
