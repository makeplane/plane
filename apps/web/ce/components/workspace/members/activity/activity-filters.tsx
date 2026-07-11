/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";

export type TWorkspaceActivityDateRange = "today" | "last_7_days" | "last_30_days" | "all_time";

export const WORKSPACE_ACTIVITY_DATE_RANGE_OPTIONS: {
  value: TWorkspaceActivityDateRange;
  i18nKey: string;
}[] = [
  { value: "today", i18nKey: "workspace_settings.settings.members.activity.filters.date_range.today" },
  { value: "last_7_days", i18nKey: "workspace_settings.settings.members.activity.filters.date_range.last_7_days" },
  { value: "last_30_days", i18nKey: "workspace_settings.settings.members.activity.filters.date_range.last_30_days" },
  { value: "all_time", i18nKey: "workspace_settings.settings.members.activity.filters.date_range.all_time" },
];

type TWorkspaceActivityFiltersProps = {
  dateRange: TWorkspaceActivityDateRange;
  onDateRangeChange: (value: TWorkspaceActivityDateRange) => void;
  onMembersChange: (value: string[]) => void;
  onProjectsChange: (value: string[]) => void;
  selectedMemberIds: string[];
  selectedProjectIds: string[];
};

export const WorkspaceActivityFilters = observer(function WorkspaceActivityFilters(
  props: TWorkspaceActivityFiltersProps
) {
  const { dateRange, onDateRangeChange, onMembersChange, onProjectsChange, selectedMemberIds, selectedProjectIds } =
    props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const selectedDateRangeOption = WORKSPACE_ACTIVITY_DATE_RANGE_OPTIONS.find((option) => option.value === dateRange);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="h-7">
        <MemberDropdown
          multiple
          value={selectedMemberIds}
          onChange={onMembersChange}
          placeholder={t("workspace_settings.settings.members.activity.filters.all_members")}
          buttonVariant="border-with-text"
          buttonContainerClassName="h-full"
          buttonClassName="h-full px-2"
          showUserDetails
          dropdownArrow
        />
      </div>
      <div className="h-7">
        <ProjectDropdown
          multiple
          value={selectedProjectIds}
          onChange={onProjectsChange}
          placeholder={t("workspace_settings.settings.members.activity.filters.all_projects")}
          buttonVariant="border-with-text"
          buttonContainerClassName="h-full"
          buttonClassName="h-full px-2"
          dropdownArrow
        />
      </div>
      <CustomSelect
        value={dateRange}
        onChange={(value: TWorkspaceActivityDateRange) => onDateRangeChange(value)}
        label={selectedDateRangeOption ? t(selectedDateRangeOption.i18nKey) : ""}
        buttonClassName="h-7 px-2"
      >
        {WORKSPACE_ACTIVITY_DATE_RANGE_OPTIONS.map((option) => (
          <CustomSelect.Option key={option.value} value={option.value}>
            {t(option.i18nKey)}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
});
