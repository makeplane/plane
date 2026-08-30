/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// types
import type { TTimeLogFilters } from "@plane/types";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";

type Props = {
  filters: TTimeLogFilters;
  onChange: (filters: TTimeLogFilters) => void;
};

export const WorklogsFilters = observer(function WorklogsFilters({ filters, onChange }: Props) {
  const { t } = useTranslation();

  const isFilterApplied = !!filters.user_id || !!filters.project_id || !!filters.start_date || !!filters.end_date;

  const handleUserChange = (user_id: string | null) => onChange({ ...filters, user_id });
  const handleProjectChange = (project_id: string) => onChange({ ...filters, project_id });
  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) =>
    onChange({
      ...filters,
      start_date: range?.from ? range.from.toISOString().slice(0, 10) : null,
      end_date: range?.to ? range.to.toISOString().slice(0, 10) : null,
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MemberDropdown
        multiple={false}
        value={filters.user_id ?? null}
        onChange={handleUserChange}
        buttonVariant="border-with-text"
        placeholder={t("common.members")}
        buttonClassName="rounded-md"
      />
      <ProjectDropdown
        multiple={false}
        value={filters.project_id ?? null}
        onChange={handleProjectChange}
        buttonVariant="border-with-text"
        placeholder={t("common.projects")}
        buttonClassName="rounded-md"
      />
      <DateRangeDropdown
        value={{
          from: filters.start_date ? new Date(filters.start_date) : undefined,
          to: filters.end_date ? new Date(filters.end_date) : undefined,
        }}
        onSelect={handleDateRangeChange}
        buttonVariant="border-with-text"
        buttonClassName="rounded-md"
        placeholder={{ from: t("date"), to: t("date") }}
      />
      {isFilterApplied && (
        <button
          type="button"
          className="text-caption-medium text-tertiary underline underline-offset-2 hover:text-secondary"
          onClick={() => onChange({})}
        >
          {t("common.clear")}
        </button>
      )}
    </div>
  );
});
