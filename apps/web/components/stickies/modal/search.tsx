/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { useTranslation } from "@plane/i18n";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";
import { useSticky } from "@/hooks/use-stickies";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

export const StickySearch = observer(function StickySearch() {
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { searchQuery, updateSearchQuery, fetchWorkspaceStickies } = useSticky();
  const { t } = useTranslation();
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") {
        updateSearchQuery("");
        fetchStickies();
      } else setIsSearchOpen(false);
    }
  };

  const fetchStickies = async () => {
    await fetchWorkspaceStickies(workspaceSlug.toString());
  };

  const debouncedSearch = useCallback(
    debounce(async () => {
      await fetchStickies();
    }, 500),
    [fetchWorkspaceStickies]
  );

  return (
    <div className="my-auto mr-2 flex items-center">
      {!isSearchOpen && (
        <IconButton
          variant="ghost"
          size="md"
          render={<button type="button" className="-mr-2" />}
          icon={<Icon icon={SearchOutline} />}
          aria-label={t("stickies.search_placeholder")}
          onClick={() => {
            setIsSearchOpen(true);
          }}
        />
      )}
      <div
        inert={!isSearchOpen}
        aria-hidden={!isSearchOpen}
        className={cn(
          "ml-auto flex w-0 items-center justify-start gap-1 overflow-hidden rounded-md border border-transparent text-placeholder opacity-0 transition-[width] ease-linear",
          {
            "w-30 border-subtle px-2.5 py-1.5 opacity-100 md:w-64": isSearchOpen,
          }
        )}
      >
        <SearchOutline className="size-3.5 shrink-0" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-body-xs-regular text-primary placeholder:text-placeholder focus:outline-none"
          aria-label={t("stickies.search_placeholder")}
          placeholder={t("stickies.search_placeholder")}
          value={searchQuery}
          onChange={(e) => {
            updateSearchQuery(e.target.value);
            debouncedSearch();
          }}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <IconButton
            type="button"
            variant="ghost"
            size="xs"
            aria-label={t("close")}
            showTooltip={false}
            icon={<Icon icon={CloseOutline} />}
            onClick={() => {
              updateSearchQuery("");
              setIsSearchOpen(false);
              fetchStickies();
            }}
          />
        )}
      </div>
    </div>
  );
});
