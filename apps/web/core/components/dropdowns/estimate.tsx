/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { cn } from "@plane/utils";
// local imports
import { LEGACY_BUTTON_SELECT_VARIANT } from "./constants";
import { EstimateSelect } from "./estimate/estimate-select";
import { LegacyDropdownContainer } from "./legacy-dropdown-container";
import type { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  /** @deprecated No effect — `select-ghost` chrome reveals its own chevron on hover. */
  dropdownArrow?: boolean;
  /** @deprecated No effect. */
  dropdownArrowClassName?: string;
  onChange: (val: string | undefined) => void;
  onClose?: () => void;
  projectId: string | undefined;
  value: string | undefined | null;
  /** @deprecated No effect — the Select mounts lazily on first click. */
  renderByDefault?: boolean;
};

/**
 * @deprecated Phase-A adapter (critic C15) over the `EstimateSelect` binding in
 * `./estimate/estimate-select`. Use `EstimateSelect` with an explicit `variant` in new code; this
 * adapter is deleted once every call site has moved.
 */
export function EstimateDropdown(props: Props) {
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className,
    disabled = false,
    onChange,
    onClose,
    placeholder = "",
    placement,
    projectId,
    showTooltip = false,
    tabIndex,
    value,
  } = props;

  return (
    <LegacyDropdownContainer className={className} placement={placement}>
      <EstimateSelect
        value={value}
        onChange={onChange}
        projectId={projectId}
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
