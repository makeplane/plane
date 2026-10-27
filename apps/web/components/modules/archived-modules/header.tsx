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
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// plane helpers
// types
import type { TModuleFilters } from "@plane/types";
import { cn, calculateTotalFilters } from "@plane/utils";
// components
import { ArchiveTabsList } from "@/components/archives";
import { ModuleOrderByDropdown } from "@/components/modules";
// helpers
import { ModuleFiltersDropdown } from "@/components/modules/dropdowns/filters/dropdown";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const ArchivedModulesHeader = observer(function ArchivedModulesHeader() {
  // router
  const { projectId } = useParams();
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  // hooks
  const {
    currentProjectArchivedFilters,
    currentProjectDisplayFilters,
    archivedModulesSearchQuery,
    updateFilters,
    updateDisplayFilters,
    updateArchivedModulesSearchQuery,
  } = useModuleFilter();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(archivedModulesSearchQuery !== "");
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && archivedModulesSearchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleFilters = useCallback(
    (key: keyof TModuleFilters, value: string | string[]) => {
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
      if (archivedModulesSearchQuery && archivedModulesSearchQuery.trim() !== "") updateArchivedModulesSearchQuery("");
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
              value={archivedModulesSearchQuery}
              onChange={(e) => updateArchivedModulesSearchQuery(e.target.value)}
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
                  updateArchivedModulesSearchQuery("");
                  setIsSearchOpen(false);
                  requestAnimationFrame(() => searchButtonRef.current?.focus());
                }}
                icon={<Icon icon={CloseOutline} />}
              />
            )}
          </InputGroup>
        </div>
        <ModuleOrderByDropdown
          value={currentProjectDisplayFilters?.order_by}
          onChange={(val) => {
            if (!projectId || val === currentProjectDisplayFilters?.order_by) return;
            updateDisplayFilters(projectId.toString(), {
              order_by: val,
            });
          }}
        />
        <ModuleFiltersDropdown
          isFiltersApplied={isFiltersApplied}
          displayFilters={currentProjectDisplayFilters ?? {}}
          filters={currentProjectArchivedFilters ?? {}}
          handleDisplayFiltersUpdate={(val) => {
            if (!projectId) return;
            updateDisplayFilters(projectId.toString(), val);
          }}
          handleFiltersUpdate={handleFilters}
          memberIds={workspaceMemberIds ?? undefined}
          isArchived
        />
      </div>
    </div>
  );
});
