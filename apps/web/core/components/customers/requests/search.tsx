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

import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// i18n
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  isWorkItemLevel?: boolean;
};

export const CustomerRequestSearch = observer(function CustomerRequestSearch(props: TProps) {
  const { isWorkItemLevel = false } = props;
  // i18n
  const { t } = useTranslation();
  const {
    customerRequestSearchQuery,
    updateCustomerRequestSearchQuery,
    workItems: { workItemRequestSearchQuery, updateWorkItemRequestSearchQuery },
  } = useCustomers();
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen) {
      if (!isWorkItemLevel) {
        if (customerRequestSearchQuery.trim() === "") {
          setIsSearchOpen(false);
        }
      } else if (workItemRequestSearchQuery.trim() === "") {
        setIsSearchOpen(false);
      }
    }
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (isWorkItemLevel) {
        if (workItemRequestSearchQuery && workItemRequestSearchQuery.trim() !== "")
          updateWorkItemRequestSearchQuery("");
      } else if (customerRequestSearchQuery && customerRequestSearchQuery.trim() !== "")
        updateCustomerRequestSearchQuery("");
      else setIsSearchOpen(false);
    }
  };

  const hadleUpdateSearchQuery = (query: string) => {
    if (isWorkItemLevel) updateWorkItemRequestSearchQuery(query);
    else updateCustomerRequestSearchQuery(query);
  };

  /**Clear search before after render */
  useEffect(() => {
    if (isWorkItemLevel) updateWorkItemRequestSearchQuery("");
    else updateCustomerRequestSearchQuery("");
  }, []);

  return (
    <div className="flex items-center">
      {!isSearchOpen && (
        <button
          type="button"
          className="-mr-1 p-2 hover:bg-layer-1 rounded-sm text-placeholder grid place-items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSearchOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      )}
      <div
        className={cn(
          "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-surface-1 text-placeholder w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-30 md:w-64 px-2.5 py-1 border-subtle-1 opacity-100": isSearchOpen,
          }
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
          placeholder={t("common.search.label")}
          value={isWorkItemLevel ? workItemRequestSearchQuery : customerRequestSearchQuery}
          onChange={(e) => hadleUpdateSearchQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="grid place-items-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              hadleUpdateSearchQuery("");
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
