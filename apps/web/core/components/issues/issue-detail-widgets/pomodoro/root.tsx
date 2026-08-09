/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TIssueServiceType } from "@plane/types";
import { Collapsible } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { PomodoroCollapsibleContent } from "./content";
import { PomodoroCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueServiceType: TIssueServiceType;
};

export const PomodoroCollapsible = observer(function PomodoroCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, issueServiceType } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  // derived values
  const isCollapsibleOpen = openWidgets.includes("pomodoro");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("pomodoro")}
      title={<PomodoroCollapsibleTitle isOpen={isCollapsibleOpen} />}
      buttonClassName="w-full"
    >
      <PomodoroCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        issueServiceType={issueServiceType}
      />
    </Collapsible>
  );
});
