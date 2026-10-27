/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { CloseOutline, FilterOutline, SearchOutline } from "@makeplane/propel/icons";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// plane helpers
// helpers
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectView } from "@/hooks/store/use-project-view";
import { FiltersDropdown } from "../issues/issue-layouts/filters";
import { ViewFiltersSelection } from "./filters/filter-selection";
import { ViewOrderByDropdown } from "./filters/order-by";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { Input, InputGroup } from "@makeplane/propel/components/input";

export const ViewListHeader = observer(function ViewListHeader() {
  // translation
  const { t } = useTranslation();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  // store hooks
  const { filters, updateFilters } = useProjectView();
  const {
    project: { projectMemberIds },
  } = useMember();

  // handlers
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (filters?.searchQuery && filters?.searchQuery.trim() !== "") {
        updateFilters("searchQuery", "");
      } else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
        requestAnimationFrame(() => searchButtonRef.current?.focus());
      }
    }
  };

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && filters?.searchQuery.trim() === "") setIsSearchOpen(false);
  });

  useEffect(() => {
    if (filters?.searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [filters?.searchQuery]);

  return (
    <div className="flex h-full items-center gap-2">
      <div className="flex items-center">
        {!isSearchOpen && (
          <IconButton
            ref={searchButtonRef}
            variant="ghost"
            size="md"
            render={<button type="button" className="-mr-1" />}
            onClick={() => {
              setIsSearchOpen(true);
              requestAnimationFrame(() => {
                if (inputRef.current && !inputRef.current.closest("[inert]")) inputRef.current.focus();
              });
            }}
            icon={<Icon icon={SearchOutline} />}
            aria-label={t("common.search.label")}
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
              value={filters?.searchQuery}
              onChange={(e) => updateFilters("searchQuery", e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            {isSearchOpen && (
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                aria-label={t("close")}
                onClick={() => {
                  updateFilters("searchQuery", "");
                  setIsSearchOpen(false);
                  requestAnimationFrame(() => searchButtonRef.current?.focus());
                }}
                icon={<Icon icon={CloseOutline} />}
              />
            )}
          </InputGroup>
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <ViewOrderByDropdown
          sortBy={filters.sortBy}
          sortKey={filters.sortKey}
          onChange={(val) => {
            if (val.key) updateFilters("sortKey", val.key);
            if (val.order) updateFilters("sortBy", val.order);
          }}
        />
        <FiltersDropdown
          icon={<FilterOutline className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          isFiltersApplied={false}
        >
          <ViewFiltersSelection
            filters={filters}
            handleFiltersUpdate={updateFilters}
            memberIds={projectMemberIds ?? undefined}
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
