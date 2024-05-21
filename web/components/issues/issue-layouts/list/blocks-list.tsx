import { FC, MutableRefObject } from "react";
// components
import { TGroupedIssues, TIssue, IIssueDisplayProperties, TIssueMap, TUnGroupedIssues } from "@plane/types";
import { IssueBlockRoot } from "@/components/issues/issue-layouts/list";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// types
import { TRenderQuickActions } from "./list-view-types";

interface Props {
  groupId: string;
  issueIds: TGroupedIssues | TUnGroupedIssues | any;
  issuesMap: TIssueMap;
  canEditProperties: (projectId: string | undefined) => boolean;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  selectionHelpers: TSelectionHelper;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const {
    groupId,
    issueIds,
    issuesMap,
    updateIssue,
    quickActions,
    displayProperties,
    canEditProperties,
    containerRef,
    selectionHelpers,
  } = props;

  return (
    <div className="relative h-full w-full">
      {issueIds && issueIds.length > 0 ? (
        issueIds.map((issueId: string) => (
          <IssueBlockRoot
            groupId={groupId}
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
            selectionHelpers={selectionHelpers}
          />
        ))
      ) : (
        <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues</div>
      )}
    </div>
  );
};
