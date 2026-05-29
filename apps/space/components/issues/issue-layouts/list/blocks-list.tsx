import type { MutableRefObject } from "react";
// types
import type { IIssueDisplayProperties } from "@plane/types";
import { IssueBlock } from "./block";

interface Props {
  issueIds: string[] | undefined;
  groupId: string;
  displayProperties?: IIssueDisplayProperties;
  containerRef: MutableRefObject<HTMLDivElement | null>;
}

export function IssueBlocksList(props: Props) {
  const { issueIds = [], groupId, displayProperties } = props;

  return (
    <div className="relative size-full">
      {issueIds?.map((issueId) => (
        <IssueBlock key={issueId} issueId={issueId} displayProperties={displayProperties} groupId={groupId} />
      ))}
    </div>
  );
}
