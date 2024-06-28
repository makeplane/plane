"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import {
  SubIssuesHeader,
  SubIssuesAccordion,
  RelationsHeader,
  AttachmentsHeader,
  LinksHeader,
  RelationsAccordion,
  LinksAccordion,
  AttachmentsAccordion,
} from "@/components/issues/issue-detail/central-pane";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const CentralPane: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;

  // store hooks
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId },
    relation: { getRelationsByIssueId },
  } = useIssueDetail();

  // derived values
  const issue = getIssueById(issueId);
  const subIssues = subIssuesByIssueId(issueId);
  const issueRelations = getRelationsByIssueId(issueId);

  // render conditions
  const shouldRenderSubIssues = !!subIssues && subIssues.length > 0;
  const shouldRenderRelations = Object.values(issueRelations ?? {}).some((relation) => relation.length > 0);
  const shouldRenderLinks = !!issue?.link_count && issue?.link_count > 0;
  const shouldRenderAttachments = !!issue?.attachment_count && issue?.attachment_count > 0;

  const headerComponents = [SubIssuesHeader, RelationsHeader, LinksHeader, AttachmentsHeader];

  const accordionComponents = [
    {
      shouldRender: shouldRenderSubIssues,
      component: SubIssuesAccordion,
    },
    {
      shouldRender: shouldRenderRelations,
      component: RelationsAccordion,
    },
    {
      shouldRender: shouldRenderLinks,
      component: LinksAccordion,
    },
    {
      shouldRender: shouldRenderAttachments,
      component: AttachmentsAccordion,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        {headerComponents.map((HeaderComponent, index) => (
          <HeaderComponent
            key={index}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="flex flex-col">
        {accordionComponents.map(
          ({ shouldRender, component: AccordionComponent }, index) =>
            shouldRender && (
              <AccordionComponent
                key={index}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                disabled={disabled}
              />
            )
        )}
      </div>
    </div>
  );
});
