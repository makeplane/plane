/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import type { TIssueServiceType } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { IssuePagesCollapsibleContent } from "./content";
import { IssuePagesCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssuePagesCollapsible = observer(function IssuePagesCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [count, setCount] = useState(0);
  const isOpen = openWidgets.includes("pages");
  const onCountChange = useCallback((nextCount: number) => setCount(nextCount), []);

  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={() => toggleOpenWidget("pages")}
      title={
        <IssuePagesCollapsibleTitle
          isOpen={isOpen}
          count={count}
          disabled={disabled}
          onLink={() => setPickerOpen(true)}
        />
      }
      buttonClassName="w-full"
    >
      <IssuePagesCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
        pickerOpen={pickerOpen}
        onPickerClose={() => setPickerOpen(false)}
        onCountChange={onCountChange}
      />
    </Collapsible>
  );
});
