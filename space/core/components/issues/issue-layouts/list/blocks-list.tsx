import { FC, MutableRefObject } from "react";
// types
import { IIssueDisplayProperties } from "@plane/types";
import { IssueBlock } from "./block";

interface Props {
  issueIds: string[] | undefined;
  groupId: string;
  displayProperties?: IIssueDisplayProperties;
  containerRef: MutableRefObject<HTMLDivElement | null>;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { issueIds = [], groupId, displayProperties } = props;

  return (
    <div className="relative h-full w-full">
      {issueIds &&
        issueIds?.length > 0 &&
        issueIds.map((issueId: string) => (
          <IssueBlock key={issueId} issueId={issueId} displayProperties={displayProperties} groupId={groupId} />
        ))}
    </div>
  );
};
