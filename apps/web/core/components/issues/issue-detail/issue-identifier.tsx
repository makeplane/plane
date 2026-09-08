/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TIssueIdentifierProps } from "@plane/types";
// helpers
import { getIssueKey } from "@/helpers/issue-key.helper";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
// components
import { IssueTypeBadge } from "@/components/issues/issue-type-badge";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";

export const IssueIdentifier = observer(function IssueIdentifier(props: TIssueIdentifierProps) {
  const { projectId, variant, size, displayProperties, enableClickToCopyIdentifier = false } = props;
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // Determine if the component is using store data or not
  const isUsingStoreData = "issueId" in props;
  // derived values
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  // Questimus fork change (Phase 3): type badge next to the key — the type_id
  // flows from the store (list/board rows) or the explicit prop (relations,
  // preview cards, sub-issues, ⌘K).
  const issueTypeId = isUsingStoreData ? issue?.type_id : props.issueTypeId;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;

  if (!shouldRenderIssueID) return null;

  return (
    <div className="flex shrink-0 items-center space-x-2">
      <IdentifierText
        identifier={getIssueKey(projectIdentifier, issueSequenceId)}
        enableClickToCopyIdentifier={enableClickToCopyIdentifier}
        variant={variant}
        size={size}
      />
      {issueTypeId && (
        <IssueTypeBadge
          typeId={issueTypeId}
          projectId={projectId}
          size={size === "lg" ? "md" : size === "md" ? "sm" : "xs"}
        />
      )}
    </div>
  );
});
