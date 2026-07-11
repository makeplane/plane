/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// i18n
import { useTranslation } from "@plane/i18n";
import { StartDatePropertyIcon, DueDatePropertyIcon } from "@plane/propel/icons";
// types
import type { TBulkIssueProperties, TIssuePriorities } from "@plane/types";
// helpers
import { renderFormattedPayloadDate } from "@plane/utils";
// components
import { CycleDropdown } from "@/components/dropdowns/cycle";
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { IssuePropertyLabels } from "@/components/issues/issue-layouts/properties/labels";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  projectId: string;
  properties: Partial<TBulkIssueProperties>;
  handleChange: (data: Partial<TBulkIssueProperties>) => void;
  disabled?: boolean;
};

/**
 * @description renders the row of editable dropdowns for the bulk operations toolbar.
 * Selected values accumulate in the parent `properties` state and are only sent when the user hits "Update".
 * Feature dropdowns (cycle / module / estimate) render only when the project has the feature enabled.
 */
export const IssueBulkOperationsProperties = observer(function IssueBulkOperationsProperties(props: Props) {
  const { projectId, properties, handleChange, disabled = false } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  // derived values
  const projectDetails = getProjectById(projectId);
  const isCycleEnabled = !!projectDetails?.cycle_view;
  const isModuleEnabled = !!projectDetails?.module_view;
  const isEstimateEnabled = areEstimateEnabledByProjectId(projectId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* state */}
      <StateDropdown
        value={properties.state_id}
        onChange={(val: string) => handleChange({ state_id: val })}
        projectId={projectId}
        buttonVariant="border-with-text"
        disabled={disabled}
        showTooltip
      />
      {/* priority */}
      <PriorityDropdown
        value={properties.priority}
        onChange={(val: TIssuePriorities) => handleChange({ priority: val })}
        buttonVariant="border-with-text"
        disabled={disabled}
        showTooltip
      />
      {/* assignees */}
      <MemberDropdown
        projectId={projectId}
        value={properties.assignee_ids ?? []}
        onChange={(val: string[]) => handleChange({ assignee_ids: val })}
        multiple
        buttonVariant="border-with-text"
        placeholder={t("common.assignees")}
        disabled={disabled}
        showTooltip
      />
      {/* labels */}
      <div className="h-7">
        <IssuePropertyLabels
          projectId={projectId}
          value={properties.label_ids ?? []}
          onChange={(val: string[]) => handleChange({ label_ids: val })}
          placeholderText={t("common.labels")}
          disabled={disabled}
          fullHeight
          hideDropdownArrow
        />
      </div>
      {/* start date */}
      <DateDropdown
        value={properties.start_date ?? null}
        onChange={(date: Date | null) => handleChange({ start_date: renderFormattedPayloadDate(date) ?? null })}
        placeholder={t("common.start_date")}
        icon={<StartDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
        buttonVariant="border-with-text"
        disabled={disabled}
        showTooltip
      />
      {/* target/due date */}
      <DateDropdown
        value={properties.target_date ?? null}
        onChange={(date: Date | null) => handleChange({ target_date: renderFormattedPayloadDate(date) ?? null })}
        placeholder={t("common.due_date")}
        icon={<DueDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
        buttonVariant="border-with-text"
        disabled={disabled}
        showTooltip
      />
      {/* module */}
      {isModuleEnabled && (
        <ModuleDropdown
          projectId={projectId}
          value={properties.module_ids ?? []}
          onChange={(val: string[]) => handleChange({ module_ids: val })}
          multiple
          buttonVariant="border-with-text"
          showCount
          disabled={disabled}
          showTooltip
        />
      )}
      {/* cycle */}
      {isCycleEnabled && (
        <CycleDropdown
          projectId={projectId}
          value={properties.cycle_id ?? null}
          onChange={(val: string | null) => handleChange({ cycle_id: val })}
          buttonVariant="border-with-text"
          disabled={disabled}
          showTooltip
        />
      )}
      {/* estimate */}
      {isEstimateEnabled && (
        <EstimateDropdown
          value={properties.estimate_point ?? undefined}
          onChange={(val: string | undefined) => handleChange({ estimate_point: val ?? null })}
          projectId={projectId}
          buttonVariant="border-with-text"
          disabled={disabled}
          showTooltip
        />
      )}
    </div>
  );
});
