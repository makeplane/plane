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
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { useIssueTypes } from "@/plane-web/hooks/store";
import type { TWorkflowStatusFilter } from "@plane/types";
import { Popover } from "@headlessui/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { IconButton } from "@plane/propel/icon-button";
import { ChevronDownIcon, FilterIcon, SearchIcon } from "@plane/propel/icons";
import { Input } from "@plane/propel/input";
import { cn } from "@plane/utils";
import { Checkbox } from "@plane/ui";
import { observer } from "mobx-react";
import React, { useMemo, useState } from "react";

type Props = {
  projectId: string;
  disabled?: boolean;
};

export const WorkFlowListFilters = observer(function WorkFlowListFilters(props: Props) {
  const { projectId, disabled = false } = props;
  // states
  const [searchQuery, setSearchQuery] = useState("");
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [isWorkItemTypesOpen, setIsWorkItemTypesOpen] = useState(true);
  const [isWorkItemTypesExpanded, setIsWorkItemTypesExpanded] = useState(false);
  // hooks
  const { filters } = useWorkflows();
  const { getProjectIssueTypes } = useIssueTypes();
  // derived values
  const projectWorkItemTypes = getProjectIssueTypes(projectId, true);

  const filteredWorkItemTypes = useMemo(() => {
    if (!searchQuery.trim()) return Object.values(projectWorkItemTypes);
    const query = searchQuery.toLowerCase();
    return Object.values(projectWorkItemTypes).filter((type) => (type.name ?? "").toLowerCase().includes(query));
  }, [searchQuery, projectWorkItemTypes]);

  const visibleWorkItemTypes = isWorkItemTypesExpanded ? filteredWorkItemTypes : filteredWorkItemTypes.slice(0, 5);

  const toggleStatus = (status: TWorkflowStatusFilter) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((item) => item !== status)
      : [...filters.statuses, status];
    filters.setStatuses(next);
  };

  const toggleWorkItemType = (id: string) => {
    const next = filters.workItemTypeIds.includes(id)
      ? filters.workItemTypeIds.filter((item) => item !== id)
      : [...filters.workItemTypeIds, id];
    filters.setWorkItemTypeIds(next);
  };

  const statusOptions: { label: string; value: TWorkflowStatusFilter }[] = useMemo(
    () => [
      {
        label: "Active",
        value: "active",
      },
      {
        label: "Inactive",
        value: "inactive",
      },
    ],
    []
  );

  const filteredStatusOptions = useMemo(() => {
    if (!searchQuery.trim()) return statusOptions;
    const query = searchQuery.toLowerCase();
    return statusOptions.filter((status) => status.label.toLowerCase().includes(query));
  }, [searchQuery, statusOptions]);

  return (
    <Popover className="relative">
      <Popover.Button as={React.Fragment} disabled={disabled}>
        <div className="relative">
          {filters.isFiltersChanged && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-accent-primary rounded-full" />
          )}
          <IconButton icon={FilterIcon} variant="secondary" size="lg" disabled={disabled} />
        </div>
      </Popover.Button>
      <Popover.Panel className="absolute right-0 z-20 mt-2 w-[24rem] overflow-hidden rounded-lg border border-subtle bg-surface-1 shadow-raised-200">
        <div className="border-b border-subtle pl-1 pr-3 py-2">
          <Input
            mode="true-transparent"
            inputSize="xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            prependIcon={<SearchIcon className="size-4 text-tertiary" />}
            className="text-body-lg-regular"
          />
        </div>

        <div className="border-b border-subtle p-3">
          <Collapsible open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <CollapsibleTrigger className="mb-2 flex w-full items-center justify-between text-caption-md-regular text-tertiary">
              <span>Status</span>
              <ChevronDownIcon
                className={cn("size-4 text-tertiary transition-transform", { "rotate-180": isStatusOpen })}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {filteredStatusOptions.length > 0 ? (
                filteredStatusOptions.map((status) => (
                  <label
                    key={status.value}
                    htmlFor={`workflow-status-${status.value}`}
                    className="flex items-center gap-2 text-body-sm-regular"
                  >
                    <Checkbox
                      id={`workflow-status-${status.value}`}
                      checked={filters.statuses.includes(status.value)}
                      onChange={() => toggleStatus(status.value)}
                      className="focus:outline-none"
                    />
                    <span>{status.label} </span>
                  </label>
                ))
              ) : (
                <p className="text-body-xs-regular text-placeholder">No statuses found</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="p-3">
          <Collapsible open={isWorkItemTypesOpen} onOpenChange={setIsWorkItemTypesOpen}>
            <CollapsibleTrigger className="mb-2 flex w-full items-center justify-between text-caption-md-regular text-tertiary">
              <span>Work item type</span>
              <ChevronDownIcon
                className={cn("size-4 text-tertiary transition-transform", { "rotate-180": isWorkItemTypesOpen })}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2">
                {visibleWorkItemTypes.length > 0 ? (
                  visibleWorkItemTypes.map((issueType) => {
                    if (!issueType.id) return null;
                    const issueTypeId = issueType.id;
                    return (
                      <label
                        key={issueTypeId}
                        htmlFor={`workflow-type-${issueTypeId}`}
                        className="flex items-center gap-2 text-body-sm-regular truncate"
                      >
                        <Checkbox
                          id={`workflow-type-${issueTypeId}`}
                          checked={filters.workItemTypeIds.includes(issueTypeId)}
                          onChange={() => toggleWorkItemType(issueTypeId)}
                          className="focus:outline-none"
                        />
                        <IssueTypeIdentifier issueTypeId={issueTypeId} size="xs" />
                        <span className="truncate">{issueType.name}</span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-body-xs-regular text-placeholder">No work item types found</p>
                )}
              </div>
              {filteredWorkItemTypes.length > 5 && (
                <button
                  type="button"
                  className="mt-3 text-caption-md-regular text-accent-primary hover:underline text-left"
                  onClick={() => setIsWorkItemTypesExpanded((prev) => !prev)}
                >
                  {isWorkItemTypesExpanded ? "View less" : "View all"}
                </button>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </Popover.Panel>
    </Popover>
  );
});
