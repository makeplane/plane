"use client";

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
// helpers
import { cn  } from "@plane/utils";

type Props = {
  onChange: (value: string) => void;
  value: string | undefined;
};

export const DashboardsListSearch: React.FC<Props> = observer((props) => {
  const { onChange, value } = props;
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (value && value.trim() !== "") onChange("");
      else setIsSearchOpen(false);
    }
  };

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
          <Search className="size-3.5" />
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
        <Search className="size-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
          placeholder="Search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="grid place-items-center"
            onClick={() => {
              onChange("");
              setIsSearchOpen(false);
            }}
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
});
