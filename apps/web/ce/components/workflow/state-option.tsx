/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { observer } from "mobx-react";
import { Combobox } from "@headlessui/react";
import { CheckIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkflow } from "@/hooks/store/use-workflow";

export type TStateOptionProps = {
  projectId: string | null | undefined;
  option: {
    value: string | undefined;
    query: string;
    content: React.ReactNode;
  };
  selectedValue: string | null | undefined;
  className?: string;
  filterAvailableStateIds?: boolean;
  isForWorkItemCreation?: boolean;
  alwaysAllowStateChange?: boolean;
  issueId?: string;
};

export const StateOption = observer(function StateOption(props: TStateOptionProps) {
  const {
    option,
    className = "",
    projectId,
    filterAvailableStateIds = false,
    isForWorkItemCreation = false,
    alwaysAllowStateChange = false,
    selectedValue,
    issueId,
  } = props;
  const { workspaceSlug } = useParams();
  const workflowStore = useWorkflow();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = issueId ? getIssueById(issueId) : undefined;
  const currentStateId = issue?.state_id ?? selectedValue ?? undefined;

  useEffect(() => {
    if (!workspaceSlug || !projectId || !issueId) return;
    if (!workflowStore.isWorkflowEnabledForProject(projectId)) return;
    workflowStore.fetchIssueWorkflowStatus(workspaceSlug.toString(), projectId, issueId);
  }, [workspaceSlug, projectId, issueId, workflowStore]);

  if (!option.value) return null;

  let isDisabled = false;

  if (projectId && workflowStore.isWorkflowEnabledForProject(projectId) && !alwaysAllowStateChange) {
    if (isForWorkItemCreation) {
      isDisabled = !workflowStore.isWorkItemCreationAllowed(projectId, option.value);
    } else if (filterAvailableStateIds && projectId) {
      const allowedIds = issueId
        ? (workflowStore.getAllowedStateIdsForIssue(issueId) ??
          workflowStore.getAllowedTargetStatesForProject(projectId, currentStateId))
        : null;

      if (allowedIds && currentStateId !== option.value && !allowedIds.includes(option.value)) {
        isDisabled = true;
      }
    }
  }

  if (isDisabled) return null;

  return (
    <Combobox.Option
      key={option.value}
      value={option.value}
      className={({ active, selected }) =>
        cn(`${className} ${active ? "bg-layer-transparent-hover" : ""} ${selected ? "text-primary" : "text-secondary"}`)
      }
    >
      {({ selected }) => (
        <>
          <span className="flex-grow truncate">{option.content}</span>
          {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
    </Combobox.Option>
  );
});
