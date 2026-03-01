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

import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TFilterProperty, TFilterConditionNodeForDisplay } from "@plane/types";
import { Input } from "@plane/ui";
import { toFilterArray } from "@plane/utils";
// components
import { EMPTY_FILTER_PLACEHOLDER_TEXT } from "@/components/rich-filters/shared";
// local imports
import { FILTER_VALIDATION_MESSAGE_CLASSNAMES, PopoverFilterInput } from "../shared/popover-filter-input";

type TNumberRangeFilterFieldConfig = {
  type: string;
  min?: number;
  max?: number;
};

type TNumberRangeFilterValueInputProps<P extends TFilterProperty> = {
  config: TNumberRangeFilterFieldConfig;
  condition: TFilterConditionNodeForDisplay<P, number>;
  isDisabled?: boolean;
  onChange: (value: number[]) => void;
};

export const NumberRangeFilterValueInput = observer(function NumberRangeFilterValueInput<P extends TFilterProperty>(
  props: TNumberRangeFilterValueInputProps<P>
) {
  const { config, condition, onChange, isDisabled } = props;
  // states
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fromValue, setFromValue] = useState<string>("");
  const [toValue, setToValue] = useState<string>("");
  // refs
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  // derived values
  const [fromRaw, toRaw] = toFilterArray(condition.value) ?? [];
  const from = fromRaw !== null && fromRaw !== undefined && !isNaN(Number(fromRaw)) ? Number(fromRaw) : undefined;
  const to = toRaw !== null && toRaw !== undefined && !isNaN(Number(toRaw)) ? Number(toRaw) : undefined;
  const isIncomplete = from === undefined || to === undefined;

  // Check if current input is valid for applying
  const fromNum = fromValue.trim() === "" ? undefined : parseFloat(fromValue.trim());
  const toNum = toValue.trim() === "" ? undefined : parseFloat(toValue.trim());
  const isApplyDisabled =
    (fromNum === undefined && toNum === undefined) ||
    (fromNum !== undefined && isNaN(fromNum)) ||
    (toNum !== undefined && isNaN(toNum)) ||
    (fromNum !== undefined && toNum === undefined) ||
    (fromNum === undefined && toNum !== undefined);

  const displayText = from !== undefined && to !== undefined ? `${from} → ${to}` : undefined;

  useEffect(() => {
    setFromValue(from !== undefined ? from.toString() : "");
    setToValue(to !== undefined ? to.toString() : "");
  }, [from, to]);

  useEffect(() => {
    if (isIncomplete && !isDisabled) {
      setIsOpen(true);
    }
  }, [isIncomplete, isDisabled]);

  useEffect(() => {
    if (isOpen && fromRef.current) {
      fromRef.current.focus();
    }
  }, [isOpen]);

  const handleApply = () => {
    const fromNum = fromValue.trim() === "" ? undefined : parseFloat(fromValue.trim());
    const toNum = toValue.trim() === "" ? undefined : parseFloat(toValue.trim());

    if (fromNum !== undefined && toNum !== undefined && !isNaN(fromNum) && !isNaN(toNum)) {
      // Ensure from <= to
      if (fromNum <= toNum) {
        // Apply min/max constraints if configured
        let finalFrom = fromNum;
        let finalTo = toNum;

        if (config.min !== undefined) {
          finalFrom = Math.max(finalFrom, config.min);
          finalTo = Math.max(finalTo, config.min);
        }
        if (config.max !== undefined) {
          finalFrom = Math.min(finalFrom, config.max);
          finalTo = Math.min(finalTo, config.max);
        }

        onChange([finalFrom, finalTo]);
        setIsOpen(false);
      } else {
        // Swap values if from > to
        const correctedFrom = Math.min(fromNum, toNum);
        const correctedTo = Math.max(fromNum, toNum);
        setFromValue(correctedFrom.toString());
        setToValue(correctedTo.toString());
      }
    } else if (fromNum === undefined && toNum === undefined) {
      onChange([]);
      setIsOpen(false);
    }
    // If values are invalid or incomplete, don't close the popover
  };

  const handleCancel = () => {
    setFromValue(from !== undefined ? from.toString() : "");
    setToValue(to !== undefined ? to.toString() : "");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: "from" | "to") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "from" && toRef.current) {
        toRef.current.focus();
      } else {
        handleApply();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    } else if (e.key === "Tab" && field === "from" && toRef.current) {
      e.preventDefault();
      toRef.current.focus();
    }
  };

  return (
    <PopoverFilterInput
      displayValue={displayText}
      isApplyDisabled={isApplyDisabled}
      isDisabled={isDisabled}
      isEmpty={from === undefined && to === undefined}
      isOpen={isOpen}
      onApply={handleApply}
      onCancel={handleCancel}
      onOpenChange={setIsOpen}
      placeholder={EMPTY_FILTER_PLACEHOLDER_TEXT}
    >
      <div className="flex items-center gap-2 w-full min-w-0">
        <Input
          ref={fromRef}
          type="number"
          inputSize="xs"
          value={fromValue}
          onChange={(e) => setFromValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "from")}
          placeholder="From"
          className="flex-1 min-w-0"
          min={config.min}
          max={config.max}
        />
        <span className="text-placeholder flex-shrink-0">→</span>
        <Input
          ref={toRef}
          type="number"
          inputSize="xs"
          value={toValue}
          onChange={(e) => setToValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "to")}
          placeholder="To"
          className="flex-1 min-w-0"
          min={config.min}
          max={config.max}
        />
      </div>
      {(config.min !== undefined || config.max !== undefined) && (
        <span className={FILTER_VALIDATION_MESSAGE_CLASSNAMES}>
          {config.min !== undefined && config.max !== undefined
            ? `Range: ${config.min} - ${config.max}`
            : config.min !== undefined
              ? `Minimum: ${config.min}`
              : `Maximum: ${config.max}`}
        </span>
      )}
    </PopoverFilterInput>
  );
});
