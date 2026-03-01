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

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TFilterProperty, TFilterConditionNodeForDisplay } from "@plane/types";
import { Input } from "@plane/ui";
// components
import { EMPTY_FILTER_PLACEHOLDER_TEXT } from "@/components/rich-filters/shared";
// local imports
import {
  FILTER_VALIDATION_MESSAGE_CLASSNAMES,
  PopoverFilterInput,
  useFilterInput,
} from "../shared/popover-filter-input";

type TNumberFilterFieldConfig = {
  type: string;
  min?: number;
  max?: number;
};

type TNumberFilterValueInputProps<P extends TFilterProperty> = {
  config: TNumberFilterFieldConfig;
  condition: TFilterConditionNodeForDisplay<P, number>;
  isDisabled?: boolean;
  onChange: (value: number | null) => void;
};

export const NumberFilterValueInput = observer(function NumberFilterValueInput<P extends TFilterProperty>(
  props: TNumberFilterValueInputProps<P>
) {
  const { config, condition, onChange, isDisabled } = props;
  // derived values
  const conditionValue = condition.value;
  const isEmpty = conditionValue === null || conditionValue === undefined;
  const displayValue = conditionValue !== null && conditionValue !== undefined ? conditionValue.toString() : undefined;

  const { isOpen, setIsOpen, inputValue, setInputValue, inputRef, handleCancel, handleKeyDown } = useFilterInput(
    Array.isArray(conditionValue) ? conditionValue[0] : conditionValue,
    isEmpty,
    isDisabled || false
  );

  // Check if current input is valid for applying
  const isApplyDisabled = inputValue.trim() === "" || isNaN(parseFloat(inputValue.trim()));

  const handleApply = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue === "") {
      onChange(null);
    } else {
      const numberValue = parseFloat(trimmedValue);
      if (!isNaN(numberValue)) {
        // Apply min/max constraints if configured
        let finalValue = numberValue;
        if (config.min !== undefined && finalValue < config.min) {
          finalValue = config.min;
        }
        if (config.max !== undefined && finalValue > config.max) {
          finalValue = config.max;
        }
        onChange(finalValue);
      } else {
        // Invalid number, reset to original value
        setInputValue(conditionValue !== null && conditionValue !== undefined ? conditionValue.toString() : "");
        return;
      }
    }
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const action = handleKeyDown(e);
    if (action === "apply") {
      handleApply();
    }
  };

  return (
    <PopoverFilterInput
      displayValue={displayValue}
      isApplyDisabled={isApplyDisabled}
      isDisabled={isDisabled}
      isEmpty={isEmpty}
      isOpen={isOpen}
      onApply={handleApply}
      onCancel={handleCancel}
      onOpenChange={setIsOpen}
      placeholder={EMPTY_FILTER_PLACEHOLDER_TEXT}
    >
      <Input
        ref={inputRef}
        type="number"
        inputSize="xs"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a value"
        className="w-full"
        min={config.min}
        max={config.max}
      />
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
