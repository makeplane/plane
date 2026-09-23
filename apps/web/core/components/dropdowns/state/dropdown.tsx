/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { LEGACY_BUTTON_SELECT_VARIANT } from "../constants";
import { LegacyDropdownContainer } from "../legacy-dropdown-container";
import type { TDropdownProps } from "../types";
import { StateSelect } from "./state-select";

/** Legacy `StateDropdown` / `IntakeStateDropdown` props, kept so their call sites compile unchanged. */
export type TLegacyStateDropdownProps = TDropdownProps & {
  /** @deprecated No effect — `select-ghost` chrome reveals its own chevron on hover. */
  dropdownArrow?: boolean;
  /** @deprecated No effect. */
  dropdownArrowClassName?: string;
  /** @deprecated No effect — CE has no workflow gating. */
  isForWorkItemCreation?: boolean;
  onChange: (val: string) => void;
  onClose?: () => void;
  projectId: string | undefined;
  /** @deprecated No effect — the Select mounts lazily on first click. */
  renderByDefault?: boolean;
  /** Shows the project's default state while `value` is empty. Defaults to `true`. */
  showDefaultState?: boolean;
  value: string | undefined | null;
};

/**
 * @deprecated Phase-A adapter (critic C15) over the `StateSelect` binding in `./state-select`.
 * Use `StateSelect` with an explicit `variant` in new code; this adapter is deleted once every call
 * site has moved.
 */
export const StateDropdown = observer(function StateDropdown(props: TLegacyStateDropdownProps) {
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
    projectId,
    showDefaultState = true,
    showTooltip = false,
    tabIndex,
    value,
  } = props;
  // store hooks
  const { getProjectDefaultStateId } = useProjectState();
  // derived values
  const stateId = value || (showDefaultState ? getProjectDefaultStateId(projectId) : undefined);

  return (
    <LegacyDropdownContainer className={className} placement={placement}>
      <StateSelect
        projectId={projectId}
        value={stateId}
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
});
