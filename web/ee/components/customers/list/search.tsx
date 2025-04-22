"use client";

import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search, X } from "lucide-react";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// i18n
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@/helpers/common.helper";
import useDebounce from "@/hooks/use-debounce";
import { useCustomers } from "@/plane-web/hooks/store";

export const CustomerSearch: FC = observer(() => {
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
        <button
          type="button"
          className="-mr-1 p-2 hover:bg-custom-background-80 rounded text-custom-text-400 grid place-items-center"
          onClick={() => {
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
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});
