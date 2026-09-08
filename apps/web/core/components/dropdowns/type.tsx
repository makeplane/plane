/**
 * Questimus fork change (Phase 3): single-select dropdown for the issue type
 * (Plan/Subplan/Task/Subtask/Ticket/Design). Used in the issue modal — the
 * created/edited work item's `type_id` drives the §5.4 planning hierarchy.
 */

import { useRef, useState, type ReactNode } from "react";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
// icons
import { CheckIcon, ChevronDownIcon, SearchIcon } from "@plane/propel/icons";
// ui
import { ComboDropDown } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// types
import type { TIssueType } from "@/helpers/issue-types.helper";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";

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
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const selectedType = types.find((type) => type.id === value);
  const filteredTypes =
    query === "" ? types : types.filter((type) => type.name.toLowerCase().includes(query.toLowerCase()));

  const dropdownOnChange = (typeId: string) => {
    onChange(typeId);
    handleClose();
  };

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    setIsOpen,
    query,
    setQuery,
  });

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={cn("h-full", { "bg-layer-1": isOpen })}
      value={value}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={
        button ? (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn("clickable block h-full w-full outline-none", {
              "cursor-not-allowed": disabled,
              "cursor-pointer": !disabled,
            })}
            onClick={handleOnClick}
            disabled={disabled}
            tabIndex={tabIndex}
          >
            {button}
          </button>
        ) : (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn("clickable flex h-full items-center gap-1.5 rounded-sm border-[0.5px] px-2 py-0.5", {
              "cursor-not-allowed text-secondary": disabled,
              "cursor-pointer": !disabled,
            })}
            onClick={handleOnClick}
            disabled={disabled}
            tabIndex={tabIndex}
          >
            <span className="flex-grow truncate text-body-xs-medium text-secondary">
              {selectedType ? selectedType.name : (placeholder ?? t("issue_type"))}
            </span>
            {!disabled && <ChevronDownIcon className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />}
          </button>
        )
      }
    >
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
              <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {filteredTypes.length > 0 ? (
                filteredTypes.map((type) => (
                  <Combobox.Option
                    key={type.id}
                    value={type.id}
                    className={({ active, selected }) =>
                      cn(
                        "flex w-full cursor-pointer items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5 select-none",
                        active ? "bg-layer-transparent-hover" : "",
                        selected ? "text-primary" : "text-secondary"
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex-grow truncate">{type.name}</span>
                        {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <p className="px-1.5 py-1 text-placeholder italic">{t("no_matching_results")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
}
