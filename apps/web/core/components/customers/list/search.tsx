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

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { IconButton } from "@plane/propel/icon-button";
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";
import useDebounce from "@/hooks/use-debounce";
import { useCustomers } from "@/plane-web/hooks/store";

export const CustomerSearch = observer(function CustomerSearch() {
  // params
  const { workspaceSlug } = useParams();
  // i18n
  const { t } = useTranslation();
  // hooks
  const { fetchCustomers, updateSearchQuery } = useCustomers();
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // derived values
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchTerm.trim() === "") setIsSearchOpen(false);
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchTerm && searchTerm.trim() !== "") setSearchTerm("");
      else setIsSearchOpen(false);
    }
  };

  useEffect(() => {
    updateSearchQuery(searchTerm);
    if (workspaceSlug) {
      fetchCustomers(workspaceSlug.toString(), searchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <div className="flex items-center">
      {!isSearchOpen && (
        <IconButton
          variant="ghost"
          size="lg"
          className="-mr-1"
          onClick={() => {
            setIsSearchOpen(true);
            inputRef.current?.focus();
          }}
          icon={Search}
        />
      )}
      <div
        className={cn(
          "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-surface-1 text-placeholder w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-30 md:w-64 px-2.5 py-1.5 border-subtle-1 opacity-100": isSearchOpen,
          }
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
          placeholder={t("common.search.label")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="grid place-items-center"
            onClick={() => {
              setSearchTerm("");
              setIsSearchOpen(false);
            }}
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});
