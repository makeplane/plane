/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TIssuePriorities } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { LEGACY_BUTTON_SELECT_VARIANT } from "./constants";
import { LegacyDropdownContainer } from "./legacy-dropdown-container";
import { PrioritySelect } from "./priority/priority-select";
import type { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  /** @deprecated No effect — `select-ghost` chrome reveals its own chevron on hover. */
  dropdownArrow?: boolean;
  /** @deprecated No effect. */
  dropdownArrowClassName?: string;
  /** @deprecated No effect — urgent is no longer highlighted. */
  highlightUrgent?: boolean;
  onChange: (val: TIssuePriorities) => void;
  onClose?: () => void;
  value: TIssuePriorities | undefined | null;
  /** @deprecated No effect — the Select mounts lazily on first click. */
  renderByDefault?: boolean;
};

/**
 * @deprecated Phase-A adapter (critic C15) over the `PrioritySelect` binding in
 * `./priority/priority-select`. Use `PrioritySelect` with an explicit `variant` in new code; this
 * adapter is deleted once every call site has moved.
 */
export function PriorityDropdown(props: Props) {
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className,
    disabled = false,
    onChange,
    onClose,
    placeholder,
    placement,
    showTooltip = false,
    tabIndex,
    value = "none",
  } = props;

  return (
    <LegacyDropdownContainer className={className} placement={placement}>
      <PrioritySelect
        value={value}
        onChange={onChange}
        variant={LEGACY_BUTTON_SELECT_VARIANT[buttonVariant]}
        disabled={disabled}
        placeholder={placeholder}
        onClose={onClose}
        className={cn("clickable", buttonContainerClassName, buttonClassName)}
        tooltip={showTooltip}
        tabIndex={tabIndex}
      />
    </LegacyDropdownContainer>
  );
}
