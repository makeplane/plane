import { FC, MutableRefObject } from "react";
// components
import { TIssue, IIssueDisplayProperties, TIssueMap, TGroupedIssues } from "@plane/types";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
// types
import { IssueBlockRoot } from "./block-root";
import { TRenderQuickActions } from "./list-view-types";
import type { TIssueType } from "@/services/project";

interface Props {
  issueIds: string[] | undefined;
  groupId: string;
  displayProperties?: IIssueDisplayProperties;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  // 新增
  issuesMap: TIssueMap;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  selectionHelpers: TSelectionHelper;
  isDragAllowed: boolean;
  canDropOverIssue: boolean;
  isEpic?: boolean;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const {
    issueIds,
    issuesMap,
    groupId,
    updateIssue,
    quickActions,
    displayProperties,
    canEditProperties,
    containerRef,
    selectionHelpers,
    isDragAllowed,
    canDropOverIssue,
    isEpic = false,
  } = props;

  return (
    <div className="relative h-full w-full">
      {issueIds &&
        issueIds.length > 0 &&
        issueIds.map((issueId: string, index: number) => (
          <IssueBlockRoot
            key={issueId}
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
            groupId={groupId}
            isLastChild={index === issueIds.length - 1}
            isDragAllowed={isDragAllowed}
            canDropOverIssue={canDropOverIssue}
            isEpic={isEpic}
          />
        ))}
    </div>
  );
};
