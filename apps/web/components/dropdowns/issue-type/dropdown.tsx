/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { Select } from "@plane/blocks/select";
import type { SelectVariant } from "@plane/blocks/select";
import { PROJECT_ISSUE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssueType } from "@plane/types";
// components
import { getIssueTypeLogoIcon, IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";

export type TIssueTypeDropdownProps = {
  /** Current work item type id (`null` / `undefined` when none). */
  value?: string | null;
  /** Emits the next work item type id (or `null` when unset). */
  onChange: (typeId: string | null) => void;
  /** Project whose active work item types are offered. */
  projectId: string;
  /** Workspace slug, used to build the fetch key. */
  workspaceSlug: string;
  disabled?: boolean;
  variant?: SelectVariant;
  placeholder?: string;
  className?: string;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
  /** value-agnostic e2e selector — forwarded to the block's trigger as data-testid */
  testId?: string;
};

/**
 * Dropdown listing a project's active work item types. Resolves the list through the issue-types
 * store (cached by `useSWR` under `PROJECT_ISSUE_TYPES`) and renders each option with its
 * `IssueTypeLogo` + name, built on the generic single-select `Select`.
 */
export const IssueTypeDropdown = observer(function IssueTypeDropdown(props: TIssueTypeDropdownProps) {
  const {
    value,
    onChange,
    projectId,
    workspaceSlug,
    disabled = false,
    variant = "pill-md",
    placeholder,
    className,
    tabIndex,
    testId,
  } = props;
  // store hooks
  const { fetchProjectIssueTypes, getIssueTypeById } = useIssueTypes();
  // translation
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("work_item_types.label");

  const { data: types } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUE_TYPES(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchProjectIssueTypes(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeTypes = useMemo(() => (types ?? []).filter((type) => type.is_active), [types]);

  // Resolved in the observer render so MobX re-renders once the type loads into the store.
  const selectedType = value
    ? ((types ?? []).find((type) => type.id === value) ?? getIssueTypeById(value) ?? null)
    : null;

  return (
    <Select<TIssueType>
      getValues={() => activeTypes}
      value={selectedType}
      onChange={onChange}
      disabled={disabled}
      placeholder={resolvedPlaceholder}
      pinSelected={false}
      getOptionValue={(type) => type.id}
      getOptionLabel={(type) => type.name}
      getOptionIcon={(type) => <IssueTypeLogo icon_props={getIssueTypeLogoIcon(type.logo_props)} size="sm" />}
    >
      <Select.Trigger<TIssueType>
        disabled={disabled}
        variant={variant}
        tabIndex={tabIndex}
        className={className}
        data-testid={testId}
        prependIcon={(selected) => {
          const type = selected[0];
          return type ? <IssueTypeLogo icon_props={getIssueTypeLogoIcon(type.logo_props)} size="sm" /> : undefined;
        }}
        label={(selected) => selected[0]?.name ?? resolvedPlaceholder}
      >
        {(selected) => {
          const type = selected[0];
          const label = type?.name ?? resolvedPlaceholder;
          return (!!type || !!resolvedPlaceholder) && <span className="min-w-0 grow truncate text-left">{label}</span>;
        }}
      </Select.Trigger>
    </Select>
  );
});
