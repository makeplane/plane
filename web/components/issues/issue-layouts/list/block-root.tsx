import React, { FC, MutableRefObject, useState } from "react";
import { observer } from "mobx-react";
import { IIssueDisplayProperties, TIssue, TIssueMap } from "@plane/types";
// components
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import { IssueBlock } from "@/components/issues/issue-layouts/list";
// hooks
import { useIssueDetail } from "@/hooks/store";
// types
import { TRenderQuickActions } from "./list-view-types";

type Props = {
  issueIds: string[];
  issueId: string;
  issuesMap: TIssueMap;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  nestingLevel: number;
  spacingLeft?: number;
  containerRef: MutableRefObject<HTMLDivElement | null>;
};

export const IssueBlockRoot: FC<Props> = observer((props) => {
  const {
    issueIds,
    issueId,
    issuesMap,
    updateIssue,
    quickActions,
    canEditProperties,
    displayProperties,
    nestingLevel,
    spacingLeft = 14,
    containerRef,
  } = props;
  // states
  const [isExpanded, setExpanded] = useState<boolean>(false);
  // store hooks
  const { subIssues: subIssuesStore } = useIssueDetail();

  if (!issueId) return null;

  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);
  return (
    <>
      <RenderIfVisible
        key={`${issueId}`}
        defaultHeight="3rem"
        root={containerRef}
        classNames="relative border-b border-b-custom-border-200 last:border-b-transparent"
        changingReference={issueIds}
      >
        <IssueBlock
          issueId={issueId}
          issuesMap={issuesMap}
          updateIssue={updateIssue}
          quickActions={quickActions}
          canEditProperties={canEditProperties}
          displayProperties={displayProperties}
          isExpanded={isExpanded}
          setExpanded={setExpanded}
          nestingLevel={nestingLevel}
          spacingLeft={spacingLeft}
        />
      </RenderIfVisible>

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <IssueBlockRoot
            key={`${subIssueId}`}
            issueIds={issueIds}
            issueId={subIssueId}
            issuesMap={issuesMap}
            updateIssue={updateIssue}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            displayProperties={displayProperties}
            nestingLevel={nestingLevel + 1}
            spacingLeft={spacingLeft + (displayProperties?.key ? 19 : 0)}
            containerRef={containerRef}
          />
        ))}
    </>
  );
});
