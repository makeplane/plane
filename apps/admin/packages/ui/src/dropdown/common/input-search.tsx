import { Combobox } from "@headlessui/react";
import { Search } from "lucide-react";
import React, { FC, useEffect, useRef } from "react";
// helpers
import { cn } from "../../utils";

interface IInputSearch {
  isOpen: boolean;
  query: string;
  updateQuery: (query: string) => void;
  inputIcon?: React.ReactNode;
  inputContainerClassName?: string;
  inputClassName?: string;
  inputPlaceholder?: string;
  isMobile: boolean;
}

export const InputSearch: FC<IInputSearch> = (props) => {
  const { isOpen, query, updateQuery, inputIcon, inputContainerClassName, inputClassName, inputPlaceholder, isMobile } =
    props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      updateQuery("");
    }
  };

  useEffect(() => {
    if (isOpen && !isMobile) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      inputRef.current && inputRef.current.focus();
    }
  }, [isOpen, isMobile]);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2",
        inputContainerClassName
      )}
    >
      {inputIcon ? <>{inputIcon}</> : <Search className="h-4 w-4 text-custom-text-300" aria-hidden="true" />}
      <Combobox.Input
        as="input"
        ref={inputRef}
        className={cn(
          "w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none",
          inputClassName
        )}
        value={query}
        onChange={(e) => updateQuery(e.target.value)}
        placeholder={inputPlaceholder ?? "Search"}
        onKeyDown={searchInputKeyDown}
      />
    </div>
  );
};
