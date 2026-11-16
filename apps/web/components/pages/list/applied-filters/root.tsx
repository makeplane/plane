/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TPageFilterProps } from "@plane/types";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
// components
import { AppliedDateFilters } from "@/components/common/applied-filters/date";
import { AppliedMembersFilters } from "@/components/common/applied-filters/members";

type Props = {
  appliedFilters: TPageFilterProps;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TPageFilterProps, value: string | null) => void;
  alwaysAllowEditing?: boolean;
};

const MEMBERS_FILTERS = new Set(["created_by"]);
const DATE_FILTERS = new Set(["created_at"]);

/**
 * A filter group is a wrapping container of chips plus their remove buttons, not a single chip,
 * so it keeps plain markup.
 */
const FILTER_GROUP_CLASSNAME =
  "my-auto flex min-h-7 flex-wrap items-center gap-1.5 rounded-md border border-subtle-1 bg-layer-2 p-2 py-0.5 text-caption-sm-regular text-tertiary hover:text-secondary";

export function PageAppliedFiltersList(props: Props) {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, alwaysAllowEditing } = props;
  const { t } = useTranslation();

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TPageFilterProps;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        const filterLabel = replaceUnderscoreIfSnakeCase(filterKey);

        return (
          <div key={filterKey} className={FILTER_GROUP_CLASSNAME}>
            <span className="text-caption-sm-regular text-tertiary capitalize">{filterLabel}</span>
            <div className="flex flex-wrap items-center gap-1">
              {DATE_FILTERS.has(filterKey) && (
                <AppliedDateFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? value : []}
                />
              )}
              {MEMBERS_FILTERS.has(filterKey) && (
                <AppliedMembersFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? value : []}
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
