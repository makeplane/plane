/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Tab, Tabs, TabsList } from "@makeplane/propel/components/tabs";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
// plane helpers
import { MODULE_VIEW_LAYOUTS } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
// types
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TModuleFilters } from "@plane/types";
// ui
import { cn, calculateTotalFilters } from "@plane/utils";
// plane utils
// components
import { ModuleOrderByDropdown } from "@/components/modules/dropdowns";
// constants
// helpers
import { ModuleFiltersDropdown } from "@/components/modules/dropdowns/filters/dropdown";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { ModuleLayoutIcon } from "./module-layout-icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { Input, InputGroup } from "@makeplane/propel/components/input";
// i18n

export const ModuleViewHeader = observer(function ModuleViewHeader() {
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  // router
  const { projectId } = useParams();
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const {
    currentProjectDisplayFilters: displayFilters,
    currentProjectFilters: filters,
    searchQuery,
    updateDisplayFilters,
    updateFilters,
    updateSearchQuery,
  } = useModuleFilter();
  const { t } = useTranslation();

  // states
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "");

  // handlers
  const handleFilters = useCallback(
    (key: keyof TModuleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = filters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), { [key]: newValues });
    },
    [filters, projectId, updateFilters]
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

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  useEffect(() => {
    if (searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [searchQuery]);

  const isFiltersApplied = calculateTotalFilters(filters ?? {}) !== 0 || displayFilters?.favorites;

  return (
    <div className="hidden h-full items-center gap-2 self-end sm:flex">
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
                  // updateSearchQuery("");
                  setIsSearchOpen(false);
                  requestAnimationFrame(() => searchButtonRef.current?.focus());
                }}
                icon={<Icon icon={CloseOutline} />}
              />
            )}
          </InputGroup>
        </div>
      </div>
      <ModuleOrderByDropdown
        value={displayFilters?.order_by}
        onChange={(val) => {
          if (!projectId || val === displayFilters?.order_by) return;
          updateDisplayFilters(projectId.toString(), {
            order_by: val,
          });
        }}
      />
      <ModuleFiltersDropdown
        isFiltersApplied={isFiltersApplied}
        displayFilters={displayFilters ?? {}}
        filters={filters ?? {}}
        handleDisplayFiltersUpdate={(val) => {
          if (!projectId) return;
          updateDisplayFilters(projectId.toString(), val);
        }}
        handleFiltersUpdate={handleFilters}
        memberIds={workspaceMemberIds ?? undefined}
      />
      <div className="hidden md:block">
        <Tabs value={displayFilters?.layout ?? null} variant="contained" stretch="auto">
          <TabsList aria-label={t("common.layout")}>
            {MODULE_VIEW_LAYOUTS.map((layout) => (
              <Tooltip key={layout.key} label={t(layout.i18n_title)} disabled={isMobile}>
                <Tab
                  value={layout.key}
                  label=""
                  aria-label={t(layout.i18n_title)}
                  icon={<ModuleLayoutIcon layoutType={layout.key} size={16} />}
                  onClick={() => {
                    if (!projectId) return;
                    updateDisplayFilters(projectId.toString(), { layout: layout.key });
                  }}
                />
              </Tooltip>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
});
