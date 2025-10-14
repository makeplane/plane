"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { TIssueServiceType } from "@plane/types";
import { Collapsible } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { RelationsCollapsibleContent } from "./content";
import { RelationsCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const RelationsCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, issueId, disabled = false, issueServiceType } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  // derived values
  const isCollapsibleOpen = openWidgets.includes("relations");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("relations")}
      title={
        <RelationsCollapsibleTitle
          isOpen={isCollapsibleOpen}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      }
      buttonClassName="w-full"
    >
      <RelationsCollapsibleContent
        workspaceSlug={workspaceSlug}
        issueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </Collapsible>
  );
});
