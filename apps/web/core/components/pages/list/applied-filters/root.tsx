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

import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
// plane imports
import type { TPageFilterProps } from "@plane/types";
import { Tag } from "@plane/ui";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
// components
import { AppliedDateFilters } from "@/components/common/applied-filters/date";
import { AppliedMembersFilters } from "@/components/common/applied-filters/members";

type Props = {
  appliedFilters: TPageFilterProps;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TPageFilterProps, value: string | null) => void;
  alwaysAllowEditing?: boolean;
  tagClassName?: string;
};

const MEMBERS_FILTERS = ["created_by"];
const DATE_FILTERS = ["created_at"];

export function PageAppliedFiltersList(props: Props) {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, alwaysAllowEditing, tagClassName } = props;
  const { t } = useTranslation();

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TPageFilterProps;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <Tag key={filterKey} className={tagClassName}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-11 text-tertiary">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
              {DATE_FILTERS.includes(filterKey) && (
                <AppliedDateFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? value : []}
                />
              )}
              {MEMBERS_FILTERS.includes(filterKey) && (
                <AppliedMembersFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? value : []}
                />
              )}
              {isEditingAllowed && (
                <button
                  type="button"
                  className="grid place-items-center text-tertiary hover:text-secondary"
                  onClick={() => handleRemoveFilter(filterKey, null)}
                >
                  <CloseIcon height={12} width={12} strokeWidth={2} />
                </button>
              )}
            </div>
          </Tag>
        );
      })}
      {isEditingAllowed && (
        <button type="button" onClick={handleClearAllFilters}>
          <Tag className={tagClassName}>
            {t("common.clear_all")}
            <CloseIcon height={12} strokeWidth={2} />
          </Tag>
        </button>
      )}
    </div>
  );
}
