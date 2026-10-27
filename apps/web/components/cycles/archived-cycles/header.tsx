/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Icon } from "@makeplane/propel/components/icon";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { IconButton } from "@makeplane/propel/components/icon-button";
// icons
import { CloseOutline, FilterOutline, SearchOutline } from "@makeplane/propel/icons";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// plane helpers
// types
import type { TCycleFilters } from "@plane/types";
import { cn, calculateTotalFilters } from "@plane/utils";
// components
import { ArchiveTabsList } from "@/components/archives";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// hooks
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { CycleFiltersSelection } from "../dropdowns";

export const ArchivedCyclesHeader = observer(function ArchivedCyclesHeader() {
  // router
  const { projectId } = useParams();
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  // hooks
  const { currentProjectArchivedFilters, archivedCyclesSearchQuery, updateFilters, updateArchivedCyclesSearchQuery } =
    useCycleFilter();
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(archivedCyclesSearchQuery !== "");
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && archivedCyclesSearchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleFilters = useCallback(
    (key: keyof TCycleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = currentProjectArchivedFilters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (currentProjectArchivedFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), { [key]: newValues }, "archived");
    },
    [currentProjectArchivedFilters, projectId, updateFilters]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (archivedCyclesSearchQuery && archivedCyclesSearchQuery.trim() !== "") updateArchivedCyclesSearchQuery("");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
        requestAnimationFrame(() => searchButtonRef.current?.focus());
      }
    }
  };

  const isFiltersApplied = calculateTotalFilters(currentProjectArchivedFilters ?? {}) !== 0;

  return (
    <div className="group relative flex border-b border-subtle">
      <div className="horizontal-scrollbar scrollbar-sm flex w-full items-center gap-2 overflow-x-auto px-4">
        <ArchiveTabsList />
      </div>
      {/* filter options */}
      <div className="flex h-full items-center gap-3 self-end px-8">
        {!isSearchOpen && (
          <IconButton
            ref={searchButtonRef}
            type="button"
            variant="ghost"
            size="md"
            aria-label={t("common.search.label")}
            showTooltip={!isMobile}
            render={<button type="button" className="-mr-5" />}
            onClick={() => {
              setIsSearchOpen(true);
              requestAnimationFrame(() => {
                if (inputRef.current && !inputRef.current.closest("[inert]")) inputRef.current.focus();
              });
            }}
            icon={<Icon icon={SearchOutline} />}
          />
        )}
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
              value={archivedCyclesSearchQuery}
              onChange={(e) => updateArchivedCyclesSearchQuery(e.target.value)}
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
                  updateArchivedCyclesSearchQuery("");
                  setIsSearchOpen(false);
                  requestAnimationFrame(() => searchButtonRef.current?.focus());
                }}
                icon={<Icon icon={CloseOutline} />}
              />
            )}
          </InputGroup>
        </div>
        <FiltersDropdown
          icon={<FilterOutline className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          isFiltersApplied={isFiltersApplied}
        >
          <CycleFiltersSelection
            filters={currentProjectArchivedFilters ?? {}}
            handleFiltersUpdate={handleFilters}
            isArchived
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
