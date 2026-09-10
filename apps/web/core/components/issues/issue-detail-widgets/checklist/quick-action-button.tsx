/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

// Deliberately not a modal — there is no checklist modal. Clicking this
// button expands the widget if it is collapsed (or reveals it, for an issue
// with zero items so far) and focuses the inline add-input rendered at the
// bottom of the list. See checklist-add-item.tsx for the focus side.
export const ChecklistActionButton = observer(function ChecklistActionButton(props: Props) {
  const { issueId, customButton, disabled = false, issueServiceType } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget, startAddingChecklistItem } = useIssueDetail(issueServiceType);

  // handlers
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only expand if currently collapsed — toggling an already-open widget
    // would collapse it out from under the user.
    if (!openWidgets.includes("checklist")) toggleOpenWidget("checklist");
    startAddingChecklistItem(issueId);
  };

  return (
    <button type="button" onClick={handleOnClick} disabled={disabled}>
      {customButton}
    </button>
  );
});
