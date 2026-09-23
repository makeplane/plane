/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { ComboboxSearch, ComboboxSearchInput } from "@makeplane/propel/elements/combobox";
import { SearchOutline } from "@makeplane/propel/icons";

type MenuSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

/**
 * Shared search field for nested menu flyouts. Keydown stays local so typing never drives a
 * parent Combobox's list navigation; Escape still bubbles so the root menu can dismiss.
 */
export function MenuSearchInput(props: MenuSearchInputProps) {
  const { value, onChange, placeholder } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);

  // This input mounts when its flyout/panel opens — take focus so typing works immediately.
  // A frame later, not `autoFocus`: press/keyboard-opened popovers run a FloatingFocusManager
  // whose initial focus (the panel) lands in a later effect and would override mount-time focus;
  // hover-opened popovers have no manager and would leave focus in the host's input entirely.
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  // Propel's search parts are Base-UI-agnostic, so they graft onto a plain input — this row lives in
  // a Popover flyout, with no Combobox context to take behavior from.
  return (
    <ComboboxSearch>
      <SearchOutline className="pointer-events-none size-4 shrink-0 text-icon-tertiary" />
      <ComboboxSearchInput
        render={
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") return;
              event.stopPropagation();
            }}
            placeholder={placeholder}
          />
        }
      />
    </ComboboxSearch>
  );
}
