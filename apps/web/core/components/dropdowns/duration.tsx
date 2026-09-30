/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import { Input } from "@plane/ui";
import { cn, normalizeWorkItemDuration } from "@plane/utils";
// components
import { DropdownButton } from "./buttons";
// constants
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";
// types
import type { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  clearIconClassName?: string;
  icon?: React.ReactNode;
  isClearable?: boolean;
  labelClassName?: string;
  onChange: (val: number | null) => void;
  onClose?: () => void;
  renderByDefault?: boolean;
  value: number | null | undefined;
};

export const DurationDropdown = observer(function DurationDropdown(props: Props) {
  const {
    buttonClassName = "",
    buttonContainerClassName,
    buttonVariant,
    className = "",
    clearIconClassName = "",
    disabled = false,
    hideIcon = false,
    icon = <Timer className="h-3 w-3 flex-shrink-0" />,
    isClearable = true,
    labelClassName = "",
    onChange,
    onClose,
    placeholder = "Duration",
    showTooltip = false,
    tabIndex,
    value,
    renderByDefault = true,
  } = props;
  // states
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  // refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  // hooks
  const { t } = useTranslation();

  const hasValue = value !== null && value !== undefined;
  const label = hasValue ? t("duration_days", { count: value }) : placeholder;

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const startEditing = () => {
    if (disabled) return;
    setDraft(hasValue ? String(value) : "");
    setIsEditing(true);
  };

  const stopEditing = () => {
    setIsEditing(false);
    onClose?.();
  };

  const commit = () => {
    const trimmed = draft.trim();
    const nextValue = trimmed === "" ? null : normalizeWorkItemDuration(Number(trimmed));
    if (nextValue !== (value ?? null)) onChange(nextValue);
    stopEditing();
  };

  if (isEditing) {
    return (
      <div className={cn("h-full", className)}>
        <Input
          ref={inputRef}
          type="number"
          min={1}
          step={1}
          mode="transparent"
          inputSize="xs"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            // A duration is a whole number of days, so the exponent, sign and decimal keys that
            // a number input would otherwise accept have no meaning here.
            if (["e", "E", "+", "-", "."].includes(e.key)) {
              e.preventDefault();
              return;
            }
            if (e.key === "Enter") commit();
            if (e.key === "Escape") stopEditing();
          }}
          className={cn("text-body-xs-medium", buttonContainerClassName)}
        />
      </div>
    );
  }

  return (
    <div className={cn("h-full", className)}>
      <button
        type="button"
        tabIndex={tabIndex}
        className={cn(
          "clickable block h-full max-w-full outline-none",
          {
            "cursor-not-allowed text-secondary": disabled,
            "cursor-pointer": !disabled,
          },
          buttonContainerClassName
        )}
        onClick={startEditing}
        disabled={disabled}
      >
        <DropdownButton
          className={buttonClassName}
          isActive={false}
          tooltipHeading={placeholder}
          tooltipContent={hasValue ? label : "None"}
          showTooltip={showTooltip}
          variant={buttonVariant}
          renderToolTipByDefault={renderByDefault}
        >
          {!hideIcon && icon}
          {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
            <span className={cn("flex-grow truncate text-left text-body-xs-medium", labelClassName)}>{label}</span>
          )}
          {isClearable && !disabled && hasValue && (
            <CloseIcon
              className={cn("h-2.5 w-2.5 flex-shrink-0", clearIconClassName)}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(null);
              }}
            />
          )}
        </DropdownButton>
      </button>
    </div>
  );
});
