/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
import type { TIssueIdentifierProps, TIssueTypeIdentifier } from "@plane/types";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspaceIssueTypes } from "@/plane-web/hooks/use-workspace-issue-types";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";

export const IssueIdentifier = observer(function IssueIdentifier(props: TIssueIdentifierProps) {
  const { projectId, variant, size, displayProperties, enableClickToCopyIdentifier = false } = props;
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const isUsingStoreData = "issueId" in props;
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;

  if (!shouldRenderIssueID) return null;

  const identifier = `${projectIdentifier}-${issueSequenceId}`;

  return (
    <div className="flex shrink-0 items-center space-x-2">
      <IdentifierText
        identifier={identifier}
        enableClickToCopyIdentifier={enableClickToCopyIdentifier}
        variant={variant}
        size={size}
      />
    </div>
  );
});

export const IssueTypeIdentifier = observer(function IssueTypeIdentifier(props: TIssueTypeIdentifier) {
  const { issueTypeId } = props;
  const { workspaceSlug } = useParams();
  const { typeMap, isLoading } = useWorkspaceIssueTypes(workspaceSlug?.toString());

  if (!issueTypeId || isLoading) return null;
  const issueType = typeMap[issueTypeId];
  if (!issueType) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded border border-subtle bg-surface-2 px-1.5 py-0.5 text-11 text-secondary">
      <SwitcherIcon logo_props={issueType.logo_props} LabelIcon={Layers} size={10} />
      <span className="truncate">{issueType.name}</span>
    </span>
  );
});
