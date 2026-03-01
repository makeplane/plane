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
import { RelationsCollapsibleContent } from "./content";
import { RelationsCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const RelationsCollapsible = observer(function RelationsCollapsible(props: Props) {
  const { workspaceSlug, issueId, disabled = false, issueServiceType } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  // derived values
  const isCollapsibleOpen = openWidgets.includes("relations");

  return (
    <Collapsible
      open={isCollapsibleOpen}
      onOpenChange={(open) => {
        if (open !== isCollapsibleOpen) {
          toggleOpenWidget("relations");
        }
      }}
    >
      <CollapsibleTrigger className="w-full">
        <RelationsCollapsibleTitle
          isOpen={isCollapsibleOpen}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <RelationsCollapsibleContent
          workspaceSlug={workspaceSlug}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      </CollapsibleContent>
    </Collapsible>
  );
});
