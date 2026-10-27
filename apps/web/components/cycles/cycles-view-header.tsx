/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { CloseOutline, FilterOutline, SearchOutline } from "@makeplane/propel/icons";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import type { TCycleFilters } from "@plane/types";
import { cn, calculateTotalFilters } from "@plane/utils";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// hooks
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { CycleFiltersSelection } from "./dropdowns";

type Props = {
  projectId: string;
};

export const CyclesViewHeader = observer(function CyclesViewHeader(props: Props) {
  const { projectId } = props;
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  // hooks
  const { currentProjectFilters, searchQuery, updateFilters, updateSearchQuery } = useCycleFilter();
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "");
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleFilters = useCallback(
    (key: keyof TCycleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = currentProjectFilters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (currentProjectFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId, { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
        requestAnimationFrame(() => searchButtonRef.current?.focus());
      }
    }
  };

  const isFiltersApplied = calculateTotalFilters(currentProjectFilters ?? {}) !== 0;

  useEffect(() => {
    if (searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [searchQuery]);

  return (
    <div className="flex items-center gap-2">
      {!isSearchOpen ? (
        <IconButton
          ref={searchButtonRef}
          variant="ghost"
          size="md"
          onClick={() => {
            setIsSearchOpen(true);
            requestAnimationFrame(() => {
              if (inputRef.current && !inputRef.current.closest("[inert]")) inputRef.current.focus();
            });
          }}
          icon={<Icon icon={SearchOutline} />}
          aria-label={t("common.search.label")}
        />
      ) : (
        <div
          inert={!isSearchOpen}
          aria-hidden={!isSearchOpen}
          className={cn("ml-auto w-0 overflow-hidden opacity-0 transition-[width] ease-linear", {
            "w-64 overflow-visible opacity-100": isSearchOpen,
          })}
        >
          <InputGroup size="lg">
            <Icon icon={SearchOutline} tint="placeholder" />
            <Input
              size="lg"
              aria-label={t("common.search.label")}
              ref={inputRef}
              placeholder={t("common.search.label")}
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            {isSearchOpen && (
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                aria-label={t("close")}
                showTooltip={!isMobile}
                onClick={() => {
                  updateSearchQuery("");
                  setIsSearchOpen(false);
                  requestAnimationFrame(() => searchButtonRef.current?.focus());
                }}
                icon={<Icon icon={CloseOutline} />}
              />
            )}
          </InputGroup>
        </div>
      )}

      <FiltersDropdown
        icon={<FilterOutline className="h-3 w-3" />}
        title={t("common.filters")}
        placement="bottom-end"
        isFiltersApplied={isFiltersApplied}
      >
        <CycleFiltersSelection filters={currentProjectFilters ?? {}} handleFiltersUpdate={handleFilters} />
      </FiltersDropdown>
    </div>
  );
});
