/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
import type { TPageFilterProps, TPageFilters } from "@plane/types";
// components
import { FilterCreatedDate } from "@/components/common/filters/created-at";
import { FilterCreatedBy } from "@/components/common/filters/created-by";
import { FilterOption } from "@/components/issues/issue-layouts/filters";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  filters: TPageFilters;
  handleFiltersUpdate: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  memberIds?: string[] | undefined;
};

export const PageFiltersSelection = observer(function PageFiltersSelection(props: Props) {
  const { filters, handleFiltersUpdate, memberIds } = props;
  const { t } = useTranslation();
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = usePlatformOS();

  useEffect(() => {
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  const handleFilters = (key: keyof TPageFilterProps, value: boolean | string | string[]) => {
    const newValues = filters.filters?.[key] ?? [];

    if (typeof newValues === "boolean" && typeof value === "boolean") return;

    if (Array.isArray(newValues)) {
      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else if (typeof value === "string") {
        if (newValues?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }
    }

    handleFiltersUpdate("filters", {
      ...filters.filters,
      [key]: newValues,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-layer-transparent p-2.5 pb-0">
        <InputGroup size="md">
          <Icon icon={SearchOutline} tint="placeholder" />
          <Input
            size="md"
            aria-label={t("common.search.label")}
            ref={inputRef}
            type="text"
            placeholder={t("common.search.label")}
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
          />
          {filtersSearchQuery !== "" && (
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              aria-label={t("common.clear")}
              onClick={() => setFiltersSearchQuery("")}
              icon={<Icon icon={CloseOutline} />}
            />
          )}
        </InputGroup>
      </div>
      <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5">
        <div className="py-2">
          <FilterOption
            isChecked={!!filters.filters?.favorites}
            onClick={() =>
              handleFiltersUpdate("filters", {
                ...filters.filters,
                favorites: !filters.filters?.favorites,
              })
            }
            title="Favorites"
          />
        </div>

        {/* created date */}
        <div className="py-2">
          <FilterCreatedDate
            appliedFilters={filters.filters?.created_at ?? null}
            handleUpdate={(val) => handleFilters("created_at", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* created by */}
        <div className="py-2">
          <FilterCreatedBy
            appliedFilters={filters.filters?.created_by ?? null}
            handleUpdate={(val) => handleFilters("created_by", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>
      </div>
    </div>
  );
});
