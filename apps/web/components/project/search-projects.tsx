/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// i18n
import { useTranslation } from "@plane/i18n";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useProjectFilter } from "@/hooks/store/use-project-filter";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { Input, InputGroup } from "@makeplane/propel/components/input";

export const ProjectSearch = observer(function ProjectSearch() {
  // i18n
  const { t } = useTranslation();
  // hooks
  const { searchQuery, updateSearchQuery } = useProjectFilter();
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else {
        setIsSearchOpen(false);
        requestAnimationFrame(() => searchButtonRef.current?.focus());
      }
    }
  };

  return (
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
          "w-30 overflow-visible opacity-100 md:w-64": isSearchOpen,
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
    </div>
  );
});
