import { FC, MutableRefObject } from "react";
// types
import { IIssueDisplayProperties, TGroupedIssues } from "@plane/types";
import { IssueBlock } from "./block";

interface Props {
  issueIds: TGroupedIssues | any;
  groupId: string;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { issueIds, groupId, displayProperties } = props;

  return (
    <div className="relative h-full w-full">
      {issueIds &&
        issueIds.length > 0 &&
        issueIds.map((issueId: string) => (
          <IssueBlock key={issueId} issueId={issueId} displayProperties={displayProperties} groupId={groupId} />
        ))}
    </div>
  );
};
