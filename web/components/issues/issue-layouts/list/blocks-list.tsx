import { FC, MutableRefObject } from "react";
// components
import { TGroupedIssues, TIssue, IIssueDisplayProperties, TIssueMap, TUnGroupedIssues } from "@plane/types";
import { IssueBlockRoot } from "@/components/issues/issue-layouts/list";
// types
import { TRenderQuickActions } from "./list-view-types";

interface Props {
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  canEditProperties: (projectId: string | undefined) => boolean;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { issueIds, issuesMap, updateIssue, quickActions, displayProperties, canEditProperties, containerRef } = props;

  return (
    <div className="relative h-full w-full">
      {issueIds && issueIds.length > 0 ? (
        issueIds.map((issueId: string) => (
          <IssueBlockRoot
            key={`${issueId}`}
            issueIds={issueIds}
            issueId={issueId}
            issuesMap={issuesMap}
            updateIssue={updateIssue}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            displayProperties={displayProperties}
            nestingLevel={0}
            spacingLeft={0}
            containerRef={containerRef}
          />
        ))
      ) : (
        <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues</div>
      )}
    </div>
  );
};
