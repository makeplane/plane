/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import type { TIssueServiceType } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { PagesCollapsibleContent } from "./content";
import { PagesCollapsibleTitle } from "./title";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  projectId: string | null | undefined;
  issueServiceType: TIssueServiceType;
};

export const PagesCollapsible = observer(function PagesCollapsible(props: TProps) {
  const { workspaceSlug, workItemId, disabled, projectId, issueServiceType } = props;
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    pages: { getPagesByIssueId, pagesMap },
  } = useIssueDetail(issueServiceType);

  // derived values
  const isCollapsibleOpen = openWidgets.includes("pages");
  const issuePages = getPagesByIssueId(workItemId);
  const count = issuePages.length;

  if (!projectId || count === 0) return null;
  return (
    <Collapsible
      open={isCollapsibleOpen}
      onOpenChange={(open) => {
        if (open !== isCollapsibleOpen) {
          toggleOpenWidget("pages");
        }
      }}
      className="max-h-fit"
    >
      <CollapsibleTrigger className="w-full">
        <PagesCollapsibleTitle
          issueServiceType={issueServiceType}
          workspaceSlug={workspaceSlug}
          isOpen={isCollapsibleOpen}
          workItemId={workItemId}
          disabled={disabled}
          count={count}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <PagesCollapsibleContent
          workItemId={workItemId}
          workspaceSlug={workspaceSlug}
          disabled={disabled}
          projectId={projectId}
          data={issuePages.map((pageId) => pagesMap[pageId])}
          issueServiceType={issueServiceType}
        />
      </CollapsibleContent>
    </Collapsible>
  );
});
