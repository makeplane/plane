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

import type { FC, SyntheticEvent } from "react";
import React from "react";
import { observer } from "mobx-react";
// Plane
import type { TIssuePriorities } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { DueDatePropertyIcon, StartDatePropertyIcon } from "@plane/propel/icons";
import type { IIssueDisplayProperties } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// components
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// helpers
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  epicId: string;
  disabled?: boolean;
  fetchInitiativeAnalytics: (workspaceSlug: string, initiativeId: string) => void;
  displayProperties?: IIssueDisplayProperties;
};

export const EpicProperties = observer(function EpicProperties(props: Props) {
  const { workspaceSlug, initiativeId, epicId, disabled = false, displayProperties = {} } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { isMobile } = usePlatformOS();

  // hooks
  const { t } = useTranslation();
  const { updateIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const {
    initiative: { fetchInitiativeAnalytics },
  } = useInitiatives();

  // derived values
  const epic = getIssueById(epicId);

  if (!epic || !epic.project_id) return null;

  // handlers
  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleState = (stateId: string) => {
    if (updateIssue) {
      updateIssue(epic.project_id, epic.id, { state_id: stateId }).then(() => {
        fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      });
    }
  };

  const handlePriority = (value: TIssuePriorities) => {
    if (updateIssue) updateIssue(epic.project_id, epic.id, { priority: value });
  };

  const handleAssignee = (ids: string[]) => {
    if (updateIssue) updateIssue(epic.project_id, epic.id, { assignee_ids: ids });
  };

  const handleStartDate = (date: Date | null) => {
    if (updateIssue)
      updateIssue(epic.project_id, epic.id, { start_date: date ? renderFormattedPayloadDate(date) : null });
  };

  const handleTargetDate = (date: Date | null) => {
    if (updateIssue)
      updateIssue(epic.project_id, epic.id, { target_date: date ? renderFormattedPayloadDate(date) : null });
  };

  const minDate = getDate(epic.start_date);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(epic.target_date);
  maxDate?.setDate(maxDate.getDate());

  const isDateRangeEnabled: boolean = Boolean(
    epic.start_date && epic.target_date && displayProperties?.start_date && displayProperties?.due_date
  );

  return (
    <div className="flex items-center gap-2">
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
        <div className="h-5 flex-shrink-0">
          <StateDropdown
            value={epic.state_id}
            projectId={epic.project_id}
            onChange={handleState}
            disabled={disabled}
            buttonVariant="transparent-without-text"
            buttonClassName="hover:bg-transparent px-0"
            iconSize="size-5"
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
        {/* priority */}
        <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <PriorityDropdown
            value={epic?.priority}
            onChange={handlePriority}
            disabled={disabled}
            buttonVariant="border-without-text"
            buttonClassName="border"
            renderByDefault={isMobile}
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* merged dates */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey={["start_date", "due_date"]}
        shouldRenderProperty={() => isDateRangeEnabled}
      >
        <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <DateRangeDropdown
            value={{
              from: getDate(epic.start_date) || undefined,
              to: getDate(epic.target_date) || undefined,
            }}
            onSelect={(range) => {
              handleStartDate(range?.from ?? null);
              handleTargetDate(range?.to ?? null);
            }}
            hideIcon={{
              from: false,
            }}
            isClearable
            mergeDates
            buttonVariant={epic.start_date || epic.target_date ? "border-with-text" : "border-without-text"}
            disabled={!disabled}
            showTooltip
            customTooltipHeading="Date Range"
            renderPlaceholder={false}
            renderInPortal
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* start date */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="start_date"
        shouldRenderProperty={() => !isDateRangeEnabled}
      >
        <div className="h-5">
          <DateDropdown
            value={epic.start_date ?? null}
            onChange={handleStartDate}
            maxDate={maxDate}
            placeholder={t("common.order_by.start_date")}
            icon={<StartDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={epic.start_date ? "border-with-text" : "border-without-text"}
            optionsClassName="z-10"
            disabled={disabled}
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* target/due date */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="due_date"
        shouldRenderProperty={() => !isDateRangeEnabled}
      >
        <div className="h-5">
          <DateDropdown
            value={epic?.target_date ?? null}
            onChange={handleTargetDate}
            minDate={minDate}
            placeholder={t("common.order_by.due_date")}
            icon={<DueDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={epic.target_date ? "border-with-text" : "border-without-text"}
            clearIconClassName="text-primary"
            optionsClassName="z-10"
            disabled={disabled}
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        {/* assignee */}
        <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <MemberDropdown
            projectId={epic?.project_id}
            value={epic?.assignee_ids}
            onChange={handleAssignee}
            disabled={disabled}
            multiple
            buttonVariant={epic.assignee_ids?.length > 0 ? "transparent-without-text" : "border-without-text"}
            buttonClassName={epic.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
            showTooltip={epic?.assignee_ids?.length === 0}
            placeholder="Assignees"
            optionsClassName="z-10"
            tooltipContent=""
            renderByDefault={isMobile}
          />
        </div>
      </WithDisplayPropertiesHOC>
    </div>
  );
});
