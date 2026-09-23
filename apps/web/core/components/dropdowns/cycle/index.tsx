/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { cn } from "@plane/utils";
// local imports
import { LEGACY_BUTTON_SELECT_VARIANT } from "../constants";
import { LegacyDropdownContainer } from "../legacy-dropdown-container";
import type { TDropdownProps } from "../types";
import { CycleSelect } from "./cycle-select";

type Props = TDropdownProps & {
  /** @deprecated No effect — `select-ghost` chrome reveals its own chevron on hover. */
  dropdownArrow?: boolean;
  /** @deprecated No effect. */
  dropdownArrowClassName?: string;
  onChange: (val: string | null) => void;
  onClose?: () => void;
  projectId: string | undefined;
  value: string | null;
  /** Offers a "No cycle" row that clears the selection. Defaults to `true`. */
  canRemoveCycle?: boolean;
  /** @deprecated No effect — the Select mounts lazily on first click. */
  renderByDefault?: boolean;
  /** Hides this cycle from the options. */
  currentCycleId?: string;
};

/**
 * @deprecated Phase-A adapter (critic C15) over the `CycleSelect` binding in `./cycle-select`.
 * Use `CycleSelect` with an explicit `variant` in new code; this adapter is deleted once every call
 * site has moved.
 */
export function CycleDropdown(props: Props) {
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
    canRemoveCycle = true,
    currentCycleId,
  } = props;

  return (
    <LegacyDropdownContainer className={className} placement={placement}>
      <CycleSelect
        projectId={projectId}
        value={value}
        onChange={onChange}
        variant={LEGACY_BUTTON_SELECT_VARIANT[buttonVariant]}
        disabled={disabled}
        placeholder={placeholder}
        onClose={onClose}
        clearable={canRemoveCycle}
        excludeIds={currentCycleId ? [currentCycleId] : undefined}
        className={cn("clickable", buttonContainerClassName, buttonClassName)}
        tooltip={showTooltip}
        tabIndex={tabIndex}
      />
    </LegacyDropdownContainer>
  );
}
