/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueIdentifierProps, TIssueIdentifierSize, TIssueTypeIdentifier } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssueTypes } from "@/hooks/store/use-issue-types";
import { useProject } from "@/hooks/store/use-project";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";

const ISSUE_TYPE_LOGO_SIZE: Record<TIssueIdentifierSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
};

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
  const issueTypeId = isUsingStoreData ? issue?.type_id : props.issueTypeId;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;
  const shouldRenderIssueTypeIcon = displayProperties ? Boolean(displayProperties.issue_type) : false;

  if (!shouldRenderIssueID && !shouldRenderIssueTypeIcon) return null;

  return (
    <div className="flex shrink-0 items-center space-x-2">
      {shouldRenderIssueTypeIcon && issueTypeId && <IssueTypeIdentifier issueTypeId={issueTypeId} size={size} />}
      {shouldRenderIssueID && (
        <IdentifierText
          identifier={`${projectIdentifier}-${issueSequenceId}`}
          enableClickToCopyIdentifier={enableClickToCopyIdentifier}
          variant={variant}
          size={size}
        />
      )}
    </div>
  );
});

export const IssueTypeIdentifier = observer(function IssueTypeIdentifier(props: TIssueTypeIdentifier) {
  const { issueTypeId, size = "sm" } = props;
  // store hooks
  const { getIssueTypeById } = useIssueTypes();
  // derived values
  const issueType = getIssueTypeById(issueTypeId);

  if (!issueType) return <></>;

  return (
    <Tooltip tooltipContent={issueType.name}>
      <div className="flex flex-shrink-0 items-center justify-center">
        <Logo logo={issueType.logo_props} size={ISSUE_TYPE_LOGO_SIZE[size]} />
      </div>
    </Tooltip>
  );
});
