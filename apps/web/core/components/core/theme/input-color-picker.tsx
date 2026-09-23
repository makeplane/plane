/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type * as React from "react";
// plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { ColorPicker, parseHexColor } from "@plane/blocks/common";
import { cn } from "@plane/utils";

export interface InputColorPickerProps {
  hasError: boolean;
  value: string | undefined;
  onChange: (value: string) => void;
  name: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder: string;
}

export function InputColorPicker(props: InputColorPickerProps) {
  const { value, hasError, onChange, name, className, style, placeholder } = props;
  // derived values: the native colour input only accepts a complete #rrggbb, and the field's own
  // validation lets a `#abc` through, so the stored value is expanded before it gets there
  const pickerValue = parseHexColor(value ?? "") ?? "#000000";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      {/* propel: the bare `Input` is transparent — `InputGroup` draws the box, `Field invalid`
          replaces the old `hasError`, and the caller's layout classes ride the group's render
          target because Propel components take no className. */}
      <Field invalid={hasError}>
        <InputGroup size="lg" render={<div className={cn(className)} style={style} />}>
          <Input
            id={name}
            name={name}
            type="text"
            size="lg"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
          />
        </InputGroup>
      </Field>

      {/* The sketch-picker popover is gone: the blocks ColorPicker opens the platform's own
          colour dialog, so the field is the hex editor and the swatch button is the free-form picker. */}
      <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
        <ColorPicker value={pickerValue} onChange={onChange} />
      </div>
    </div>
  );
}
