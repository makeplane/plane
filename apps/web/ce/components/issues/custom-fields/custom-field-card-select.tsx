/* eslint-disable jsx-a11y/no-static-element-interactions -- ComboDropDown matches card property dropdown pattern */
import { useRef, useState } from "react";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TIssueProperty, TIssuePropertyOption } from "@plane/types";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
import { useDropdown } from "@/hooks/use-dropdown";
import { getCustomFieldOptionColor } from "@/plane-web/helpers/custom-fields/format-display-value";

type Props = {
  property: TIssueProperty;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function CustomFieldCardSelect({ property, value, onChange, disabled, className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 8 } }],
  });

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    setIsOpen,
  });

  const options = property.options ?? [];
  const selectValue = value != null && value !== "" ? String(value) : null;
  const displayLabel = selectValue ?? "—";
  const optionColor = selectValue ? getCustomFieldOptionColor(selectValue, "select", options) : undefined;

  const handleChange = (val: string) => {
    onChange(val || null);
    handleClose();
  };

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={cn("relative h-5 max-w-[9rem]", className)}
      value={selectValue ?? ""}
      onChange={handleChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={
        <button
          ref={setReferenceElement}
          type="button"
          disabled={disabled}
          onClick={handleOnClick}
          className={cn(
            "relative flex h-5 w-full max-w-[9rem] items-center rounded-sm border-[0.5px] border-strong bg-layer-2 pr-6 text-caption-sm-regular text-primary",
            optionColor ? "pl-5" : "pl-2",
            "hover:bg-layer-transparent-hover focus:ring-1 focus:ring-accent-strong focus:outline-none",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-1 h-2.5 w-2.5 -translate-y-1/2 text-secondary" />
          {optionColor && (
            <span
              className="pointer-events-none absolute top-1/2 left-1.5 size-2 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: optionColor }}
            />
          )}
        </button>
      }
    >
      {isOpen && (
        <Combobox.Options className="fixed z-30" static>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="my-1 max-h-36 min-w-[9rem] overflow-y-auto rounded-md border border-subtle bg-surface-1 py-1 shadow-overlay-200"
          >
            <Combobox.Option
              value=""
              className={({ active }) =>
                cn(
                  "cursor-pointer px-2 py-1 text-caption-sm-regular text-secondary",
                  active && "bg-layer-transparent-hover"
                )
              }
            >
              —
            </Combobox.Option>
            {options.map((opt: TIssuePropertyOption) => (
              <Combobox.Option
                key={opt.value}
                value={opt.value}
                className={({ active, selected }) =>
                  cn(
                    "flex cursor-pointer items-center gap-2 px-2 py-1 text-caption-sm-regular",
                    selected ? "text-primary" : "text-secondary",
                    active && "bg-layer-transparent-hover"
                  )
                }
              >
                {opt.color && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: opt.color }} />}
                {opt.value}
              </Combobox.Option>
            ))}
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
}
