import { useRef } from "react";
import { observer } from "mobx-react";
// types
import { TGroupedIssues, IIssueDisplayProperties, TIssueGroupByOptions } from "@plane/types";
//
// import { getGroupByColumns } from "../utils";
import { ListGroup } from "./list-group";

export interface IList {
  groupedProjectIds: TGroupedIssues;
  groupBy: TIssueGroupByOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup?: boolean;
}

export const List: React.FC<IList> = observer((props) => {
  const { groupedProjectIds, groupBy, displayProperties, showEmptyGroup } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative size-full flex flex-col">
      {groupedProjectIds && (
        <>
          <div
            ref={containerRef}
            className="size-full vertical-scrollbar scrollbar-lg relative overflow-auto vertical-scrollbar-margin-top-md"
          >
            {Object.keys(groupedProjectIds).map((id: string) => (
              <ListGroup
                key={id}
                groupedProjectIds={groupedProjectIds?.[id]}
                groupBy={groupBy}
                group={id}
                displayProperties={displayProperties}
                showEmptyGroup={showEmptyGroup}
                containerRef={containerRef}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
