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

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TIssueServiceType } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { SubIssuesCollapsibleContent } from "./content";
import { SubIssuesCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const SubIssuesCollapsible = observer(function SubIssuesCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled = false, issueServiceType } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  // derived values
  const isCollapsibleOpen = openWidgets.includes("sub-work-items");

  return (
    <Collapsible
      open={isCollapsibleOpen}
      onOpenChange={(open) => {
        if (open !== isCollapsibleOpen) {
          toggleOpenWidget("sub-work-items");
        }
      }}
    >
      <CollapsibleTrigger className="w-full">
        <SubIssuesCollapsibleTitle
          isOpen={isCollapsibleOpen}
          parentIssueId={issueId}
          disabled={disabled}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SubIssuesCollapsibleContent
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          parentIssueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      </CollapsibleContent>
    </Collapsible>
  );
});
