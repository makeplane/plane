/**
 * Questimus fork change (Phase 3; rewritten 2026-09-09): single-select
 * dropdown for the issue type. Used in the issue modal and as the clickable
 * type badge in the detail/peek headers.
 *
 * Rewritten without headlessui's Combobox: plain React state + buttons (own
 * outside-click/Escape handling, absolute menu). NOTE: the actual "type
 * change does nothing" bug (2026-09-09) was NOT here — it was the switcher
 * calling issueOperations.update on an undefined store property (see
 * issue-type-switcher.tsx). The dropdown was simplified while debugging and
 * kept; the headlessui version worked via its own local state.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "@plane/i18n";
// icons
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";
// types
import type { TIssueType } from "@/helpers/issue-types.helper";

type Props = {
  value: string | null | undefined;
  onChange: (typeId: string) => void;
  types: TIssueType[];
  disabled?: boolean;
  placeholder?: string;
  tabIndex?: number;
  /** Custom trigger content (e.g. a badge-styled button) */
  button?: ReactNode;
};

export function TypeDropdown(props: Props) {
  const { value, onChange, types, disabled = false, placeholder, tabIndex, button } = props;
  const { t } = useTranslation();
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedType = types.find((type) => type.id === value);
  const filteredTypes =
    query === "" ? types : types.filter((type) => type.name.toLowerCase().includes(query.toLowerCase()));

  // close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const selectType = (typeId: string) => {
    setIsOpen(false);
    setQuery("");
    onChange(typeId);
  };

  return (
    <div ref={containerRef} className="relative h-full">
      <button
        type="button"
        className={cn("clickable block h-full w-full outline-none", {
          "cursor-not-allowed": disabled,
          "cursor-pointer": !disabled,
        })}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
        disabled={disabled}
        tabIndex={tabIndex}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {button ? (
          button
        ) : (
          <span className="flex h-full items-center gap-1.5 rounded-sm border-[0.5px] px-2 py-0.5">
            <span className="flex-grow truncate text-body-xs-medium text-secondary">
              {selectedType ? selectedType.name : (placeholder ?? t("issue_type"))}
            </span>
            {!disabled && <ChevronDownIcon className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />}
          </span>
        )}
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-10 mt-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
        >
          <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
            <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
            <input
              ref={inputRef}
              className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
            />
          </div>
          <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
            {filteredTypes.length > 0 ? (
              filteredTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  role="option"
                  aria-selected={value === type.id}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5 select-none",
                    "hover:bg-layer-transparent-hover",
                    value === type.id ? "text-primary" : "text-secondary"
                  )}
                  onClick={() => selectType(type.id)}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: type.color ?? "#94a3b8" }} />
                    <span className="flex-grow truncate">{type.name}</span>
                  </span>
                  {value === type.id && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                </button>
              ))
            ) : (
              <p className="px-1.5 py-1 italic text-placeholder">{t("no_matching_results")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
