/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
// plane imports
import type { EViewAccess, TViewFilterProps } from "@plane/types";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
// components
import { AppliedDateFilters } from "@/components/common/applied-filters/date";
import { AppliedMembersFilters } from "@/components/common/applied-filters/members";
// local imports
import { AppliedAccessFilters } from "./access";
import { APPLIED_FILTER_GROUP_CLASSNAME } from "@/components/common/removable-chip";

type Props = {
  appliedFilters: TViewFilterProps;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TViewFilterProps, value: string | EViewAccess | null) => void;
  alwaysAllowEditing?: boolean;
};

const MEMBERS_FILTERS = new Set(["owned_by"]);
const DATE_FILTERS = new Set(["created_at"]);
const VIEW_ACCESS_FILTERS = new Set(["view_type"]);

export function ViewAppliedFiltersList(props: Props) {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, alwaysAllowEditing } = props;
  const { t } = useTranslation();

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TViewFilterProps;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        const filterLabel = replaceUnderscoreIfSnakeCase(filterKey);

        return (
          <div key={filterKey} className={APPLIED_FILTER_GROUP_CLASSNAME}>
            <span className="text-caption-sm-regular text-tertiary capitalize">{filterLabel}</span>
            <div className="flex flex-wrap items-center gap-1">
              {VIEW_ACCESS_FILTERS.has(filterKey) && (
                <AppliedAccessFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? (value as EViewAccess[]) : []}
                />
              )}
              {DATE_FILTERS.has(filterKey) && (
                <AppliedDateFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? (value as string[]) : []}
                />
              )}
              {MEMBERS_FILTERS.has(filterKey) && (
                <AppliedMembersFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? (value as string[]) : []}
                />
              )}
              {isEditingAllowed && (
                <IconButton
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-label={`${t("aria_labels.common.remove")}: ${filterLabel}`}
                  onClick={() => handleRemoveFilter(filterKey, null)}
                  icon={<Icon icon={CloseOutline} />}
                />
              )}
            </div>
          </div>
        );
      })}
      {isEditingAllowed && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          stretch="auto"
          label={t("common.clear_all")}
          onClick={handleClearAllFilters}
        />
      )}
    </div>
  );
}
