/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { usePopper } from "react-popper";
import { useTranslation } from "@plane/i18n";
import type { TIssueFrequency } from "@plane/types";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
import { useDropdown } from "@/hooks/use-dropdown";
import {
  BACKGROUND_BUTTON_VARIANTS,
  BORDER_BUTTON_VARIANTS,
  BUTTON_VARIANTS_WITHOUT_TEXT,
} from "@/components/dropdowns/constants";
import type { TDropdownProps } from "@/components/dropdowns/types";
import { FrequencyButtonContent } from "./frequency-button";
import { FrequencyOptionsPanel } from "./frequency-options";

type Props = TDropdownProps & {
  onChange: (val: TIssueFrequency | null) => void;
  value: TIssueFrequency | null | undefined;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
};

export function FrequencyDropdown(props: Props) {
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    onChange,
    placeholder,
    placement,
    tabIndex,
    value,
  } = props;

  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    query,
    setIsOpen,
    setQuery,
  });

  const handleChange = (val: TIssueFrequency | null) => {
    onChange(val);
    handleClose();
  };

  const buttonContentClassName = cn(
    "hover:bg-layer-transparent-hover",
    {
      "border border-strong bg-surface-1": BORDER_BUTTON_VARIANTS.includes(buttonVariant),
      "bg-layer-transparent-hover": BACKGROUND_BUTTON_VARIANTS.includes(buttonVariant),
      "bg-layer-1": isOpen,
    },
    buttonClassName
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={cn("h-full", { "bg-layer-1": isOpen }, className)}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={
        <button
          ref={setReferenceElement}
          type="button"
          className={cn(
            "clickable block h-full max-w-full outline-none",
            { "cursor-not-allowed text-secondary": disabled, "cursor-pointer": !disabled },
            buttonContainerClassName
          )}
          onClick={handleOnClick}
          disabled={disabled}
          tabIndex={tabIndex}
        >
          <FrequencyButtonContent
            value={value}
            className={buttonContentClassName}
            dropdownArrow={dropdownArrow && !disabled}
            dropdownArrowClassName={dropdownArrowClassName}
            hideText={BUTTON_VARIANTS_WITHOUT_TEXT.includes(buttonVariant)}
            placeholder={placeholder ?? t("common.frequency")}
          />
        </button>
      }
    >
      {isOpen && (
        <FrequencyOptionsPanel
          query={query}
          onQueryChange={setQuery}
          inputRef={inputRef}
          onKeyDown={searchInputKeyDown}
          popperRef={setPopperElement}
          popperStyle={styles.popper}
          popperAttributes={attributes.popper ?? {}}
        />
      )}
    </ComboDropDown>
  );
}
