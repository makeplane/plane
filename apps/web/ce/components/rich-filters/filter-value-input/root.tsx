/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TFilterProperty, TFilterValue } from "@plane/types";
import { Input } from "@plane/ui";
// local imports
import type { TFilterValueInputProps } from "@/components/rich-filters/shared";

type TCustomPropertyMeta = {
  property_type: "text" | "number";
};

export const AdditionalFilterValueInput = observer(function AdditionalFilterValueInput<
  P extends TFilterProperty,
  V extends TFilterValue,
>(props: TFilterValueInputProps<P, V>) {
  const { condition, filterFieldConfig, isDisabled = false, onChange } = props;

  const customPropertyMeta = (filterFieldConfig as { customPropertyMeta?: TCustomPropertyMeta } | undefined)
    ?.customPropertyMeta;

  const [localValue, setLocalValue] = useState<string>(
    condition?.value != null && condition?.value !== "" ? String(condition.value) : ""
  );

  useEffect(() => {
    setLocalValue(condition?.value != null && condition?.value !== "" ? String(condition.value) : "");
  }, [condition?.value]);

  if (customPropertyMeta?.property_type === "text" || customPropertyMeta?.property_type === "number") {
    return (
      <div className="flex h-full items-center px-3">
        <Input
          type={customPropertyMeta.property_type === "number" ? "number" : "text"}
          value={localValue}
          disabled={isDisabled}
          onChange={(e) => {
            const next = e.target.value;
            setLocalValue(next);
            onChange(next as V);
          }}
          placeholder={customPropertyMeta.property_type === "number" ? "Enter number" : "Enter text"}
          className="h-7 w-full text-11"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full cursor-not-allowed items-center px-4 text-11 text-placeholder transition-opacity duration-200">
      Filter type not supported
    </div>
  );
});
