/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../shared";

type TTextFilterValueInputProps = {
  value: string;
  placeholder: string;
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
};

/**
 * Render a text filter whose local draft resets when the committed value changes.
 */
export function TextFilterValueInput(props: TTextFilterValueInputProps) {
  return <TextFilterInput key={props.value} {...props} />;
}

/**
 * Keep edits local until blur or Enter, and discard them on Escape.
 * Trim committed text and emit null to clear an empty condition.
 */
function TextFilterInput({ value, placeholder, isDisabled, onChange }: TTextFilterValueInputProps) {
  // Store only an edit; the committed value remains owned by the filter expression.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <InputGroup
      size="md"
      render={<div className={`h-full w-48 rounded-none border-0 ${COMMON_FILTER_ITEM_BORDER_CLASSNAME}`} />}
    >
      <Input
        aria-label="Filter value"
        placeholder={placeholder}
        value={draft ?? value}
        disabled={isDisabled}
        size="md"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (isDisabled) return;
          const nextValue = (draft ?? value).trim();
          setDraft(nextValue);
          if (nextValue !== value || nextValue === "") onChange(nextValue || null);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setDraft(null);
          }
        }}
      />
    </InputGroup>
  );
}
