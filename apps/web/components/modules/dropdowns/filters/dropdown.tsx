/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useRef, useState } from "react";
import type { ComponentProps, KeyboardEvent } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuTrigger } from "@makeplane/propel/components/menu";
import { MenuSearch, MenuSearchInput } from "@makeplane/propel/elements/menu";
import { CloseOutline, FilterOutline, SearchOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { DateFilterModal } from "@/components/core/filters/date-filter-modal";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { ModuleFilterMenuContext } from "./menu-controls";
import type { ModuleDateFilterRequest } from "./menu-controls";
import { ModuleFiltersSelection } from "./root";

type Props = ComponentProps<typeof ModuleFiltersSelection> & { isFiltersApplied?: boolean };

export function ModuleFiltersDropdown({ isFiltersApplied = false, ...selectionProps }: Props) {
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRequest, setDateRequest] = useState<ModuleDateFilterRequest | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const needsInitialSearchFocus = useRef(false);
  const menuContext = useMemo(() => ({ searchQuery, openDateModal: setDateRequest }), [searchQuery]);

  if (isMobile) {
    return (
      <FiltersDropdown
        icon={<FilterOutline className="h-3 w-3" />}
        title="Filters"
        placement="bottom-end"
        isFiltersApplied={isFiltersApplied}
      >
        <ModuleFiltersSelection {...selectionProps} />
      </FiltersDropdown>
    );
  }

  const focusMenuRow = (edge: "first" | "last") => {
    const rows = menuRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
    );
    const enabledRows = Array.from(rows ?? []).filter(
      (row) => !row.hasAttribute("data-disabled") && row.getAttribute("aria-disabled") !== "true"
    );
    const row = edge === "first" ? enabledRows[0] : enabledRows.at(-1);
    row?.focus();
    row?.scrollIntoView({ block: "nearest" });
    return Boolean(row);
  };

  const closeAndFocusTrigger = () => {
    needsInitialSearchFocus.current = false;
    setIsOpen(false);
    setSearchQuery("");
    triggerRef.current?.focus();
  };

  const handleHeaderTab = (event: KeyboardEvent<HTMLElement>, isSearch = false) => {
    if (
      event.key !== "Tab" ||
      dateRequest ||
      event.nativeEvent.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;

    if (event.shiftKey) {
      if (!isSearch) return;
      event.preventDefault();
      closeAndFocusTrigger();
    } else if (!isSearch || searchQuery === "") {
      // Search chrome sits outside the popup's roving focus group.
      event.preventDefault();
      if (!focusMenuRow("first")) closeAndFocusTrigger();
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      handleHeaderTab(event, true);
      return;
    }
    if (event.key === "Escape") return;
    event.stopPropagation();
    if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    focusMenuRow(event.key === "ArrowDown" ? "first" : "last");
  };

  return (
    <div>
      <Menu
        modal={false}
        open={isOpen}
        onOpenChange={(nextOpen, details) => {
          if (!nextOpen && dateRequest) {
            details.cancel();
            return;
          }
          if (nextOpen && !isOpen) needsInitialSearchFocus.current = true;
          if (!nextOpen) needsInitialSearchFocus.current = false;
          setIsOpen(nextOpen);
          if (!nextOpen) setSearchQuery("");
        }}
      >
        <MenuTrigger
          ref={triggerRef}
          render={
            <Button
              variant="secondary"
              icon={<FilterOutline className="hidden h-3 w-3 @4xl:block" />}
              size="md"
              stretch="auto"
              label="Filters"
              render={(renderProps) => (
                <button {...renderProps} type="button" className={`${renderProps.className ?? ""} relative`}>
                  {renderProps.children}
                  {isFiltersApplied && (
                    <span className="absolute -top-0.5 -right-0.5 hidden h-2 w-2 rounded-full bg-accent-primary @4xl:block" />
                  )}
                </button>
              )}
            />
          }
        />
        <ModuleFilterMenuContext.Provider value={menuContext}>
          <MenuContent
            ref={menuRef}
            onFocus={() => {
              // Preserve search focus on opening without redirecting later row navigation.
              if (!needsInitialSearchFocus.current) return;
              needsInitialSearchFocus.current = false;
              if (!dateRequest) inputRef.current?.focus();
            }}
            side="bottom"
            align="end"
            search={
              <MenuSearch>
                <Icon icon={SearchOutline} tint="tertiary" />
                <MenuSearchInput
                  ref={inputRef}
                  type="text"
                  aria-label="Search filters"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchQuery !== "" && (
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    aria-label={t("common.clear")}
                    icon={<Icon icon={CloseOutline} />}
                    onKeyDown={(event) => handleHeaderTab(event)}
                    onClick={() => {
                      setSearchQuery("");
                      inputRef.current?.focus();
                    }}
                  />
                )}
              </MenuSearch>
            }
          >
            <ModuleFiltersSelection {...selectionProps} />
            {dateRequest && (
              <DateFilterModal
                isOpen
                title={dateRequest.title}
                onSelect={(value) => selectionProps.handleFiltersUpdate(dateRequest.key, value)}
                handleClose={() => setDateRequest(null)}
              />
            )}
          </MenuContent>
        </ModuleFilterMenuContext.Provider>
      </Menu>
    </div>
  );
}
