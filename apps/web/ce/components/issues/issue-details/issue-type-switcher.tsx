/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// store hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssueTypes } from "@/hooks/store/use-issue-types";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

export type TIssueTypeSwitcherProps = {
  issueId: string;
  disabled: boolean;
};

export const IssueTypeSwitcher = observer(function IssueTypeSwitcher(props: TIssueTypeSwitcherProps) {
  const { issueId, disabled } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { getProjectIssueTypes, getIssueTypeById } = useIssueTypes();
  // derived values
  const issue = getIssueById(issueId);
  const projectDetails = issue?.project_id ? getProjectById(issue.project_id) : undefined;
  const currentIssueType = getIssueTypeById(issue?.type_id);
  // epics have a dedicated flow, so they are not offered as options when switching a work item type
  const issueTypes = getProjectIssueTypes(issue?.project_id, true)?.filter(
    (issueType) => !issueType.is_epic || issueType.id === issue?.type_id
  );

  if (!issue || !issue.project_id) return <></>;

  // fall back to the identifier only when work item types are not usable for this work item
  if (!projectDetails?.is_issue_type_enabled || !currentIssueType || !issueTypes || issueTypes.length === 0) {
    return <IssueIdentifier issueId={issueId} projectId={issue.project_id} size="md" enableClickToCopyIdentifier />;
  }

  const options = issueTypes.map((issueType) => ({
    value: issueType.id,
    query: issueType.name,
    content: (
      <div className="flex items-center gap-1.5 truncate">
        <Logo logo={issueType.logo_props} size={14} />
        <span className="truncate">{issueType.name}</span>
      </div>
    ),
  }));

  return (
    <div className="flex items-center gap-2">
      <CustomSearchSelect
        value={issue.type_id}
        onChange={(issueTypeId: string) => {
          if (!workspaceSlug || !issue.project_id || issueTypeId === issue.type_id) return;
          void updateIssue(workspaceSlug.toString(), issue.project_id, issueId, { type_id: issueTypeId });
        }}
        options={options}
        disabled={disabled}
        customButton={
          <div
            className={cn("flex items-center gap-1.5 rounded-sm px-2 py-1 text-13", {
              "cursor-not-allowed": disabled,
              "cursor-pointer hover:bg-layer-transparent-hover": !disabled,
            })}
          >
            <Logo logo={currentIssueType.logo_props} size={16} />
            <span className="font-medium text-primary">{currentIssueType.name}</span>
            {!disabled && <ChevronDownIcon className="h-3 w-3 flex-shrink-0 text-tertiary" aria-hidden="true" />}
          </div>
        }
      />
      <IssueIdentifier issueId={issueId} projectId={issue.project_id} size="md" enableClickToCopyIdentifier />
    </div>
  );
});
