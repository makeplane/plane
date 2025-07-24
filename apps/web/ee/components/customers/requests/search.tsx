"use client";

import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// i18n
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@plane/utils";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  isWorkItemLevel?: boolean;
};

export const CustomerRequestSearch: FC<TProps> = observer((props) => {
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
          className="-mr-1 p-2 hover:bg-custom-background-80 rounded text-custom-text-400 grid place-items-center"
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
          "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-30 md:w-64 px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
          }
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
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
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});
