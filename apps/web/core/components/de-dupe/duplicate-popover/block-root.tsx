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

// plane imports
import type { TDeDupeIssue } from "@plane/types";
// components
import type { TIssueOperations } from "@/components/issues/issue-detail";
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// local imports
import { DeDupeIssueBlockContent } from "../issue-block/block-content";
import { DeDupeIssueBlockWrapper } from "../issue-block/block-wrapper";
import { DeDupeIssueBlockHeader } from "./block-header";

type TDeDupeIssueBlockRootProps = {
  workspaceSlug: string;
  issue: TDeDupeIssue;
  selectionHelpers: TSelectionHelper;
  issueOperations?: TIssueOperations;
  disabled?: boolean;
  renderDeDupeActionModals?: boolean;
  isIntakeIssue?: boolean;
};

export function DeDupeIssueBlockRoot(props: TDeDupeIssueBlockRootProps) {
  const {
    workspaceSlug,
    issue,
    selectionHelpers,
    issueOperations,
    disabled = false,
    renderDeDupeActionModals,
    isIntakeIssue = false,
  } = props;
  // derived values
  const isSelected = selectionHelpers.getIsEntitySelected(issue.id);
  return (
    <DeDupeIssueBlockWrapper workspaceSlug={workspaceSlug} issue={issue} isSelected={isSelected}>
      <DeDupeIssueBlockHeader
        workspaceSlug={workspaceSlug}
        issue={issue}
        selectionHelpers={selectionHelpers}
        issueOperations={issueOperations}
        disabled={disabled}
        renderDeDupeActionModals={renderDeDupeActionModals}
        isIntakeIssue={isIntakeIssue}
      />
      <DeDupeIssueBlockContent issue={issue} />
    </DeDupeIssueBlockWrapper>
  );
}
