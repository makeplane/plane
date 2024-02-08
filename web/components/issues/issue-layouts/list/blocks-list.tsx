import { FC, MutableRefObject } from "react";
// components
import { IssueBlock } from "components/issues";
// types
import { TGroupedIssues, TIssue, IIssueDisplayProperties, TIssueMap, TUnGroupedIssues } from "@plane/types";
import { EIssueActions } from "../types";
import RenderIfVisible from "components/core/render-if-visible-HOC";

interface Props {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  canEditProperties: (projectId: string | undefined) => boolean;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { issueIds, issuesMap, handleIssues, quickActions, displayProperties, canEditProperties, containerRef } = props;

  return (
    <div className="relative h-full w-full">
      {issueIds && issueIds.length > 0 ? (
        issueIds.map((issueId: string) => {
          if (!issueId) return null;
          return (
            <RenderIfVisible
              key={`${issueId}`}
              defaultHeight="3rem"
              root={containerRef}
              classNames={"relative border border-transparent border-b-custom-border-200 last:border-b-transparent"}
              changingReference={issueIds}
            >
              <IssueBlock
                issueId={issueId}
                issuesMap={issuesMap}
                handleIssues={handleIssues}
                quickActions={quickActions}
                canEditProperties={canEditProperties}
                displayProperties={displayProperties}
              />
            </RenderIfVisible>
          );
        })
      ) : (
        <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues</div>
      )}
    </div>
  );
};
