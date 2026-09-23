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
import { ModuleSelect } from "./module-select";

type TModuleDropdownProps = TDropdownProps & {
  /** @deprecated No effect — `select-ghost` chrome reveals its own chevron on hover. */
  dropdownArrow?: boolean;
  /** @deprecated No effect. */
  dropdownArrowClassName?: string;
  projectId: string | undefined;
  /**
   * @deprecated No effect — `pill-*` / `table-cell` triggers summarise several modules as a count,
   * `select-*` triggers list them.
   */
  showCount?: boolean;
  onClose?: () => void;
  /** @deprecated No effect — the Select mounts lazily on first click. */
  renderByDefault?: boolean;
  /** @deprecated No effect. */
  itemClassName?: string;
} & (
    | {
        multiple: false;
        onChange: (val: string | null) => void;
        value: string | null;
      }
    | {
        multiple: true;
        onChange: (val: string[]) => void;
        value: string[] | null;
      }
  );

/**
 * @deprecated Phase-A adapter (critic C15) over the `ModuleSelect` binding in `./module-select`.
 * Use `ModuleSelect` with an explicit `variant` in new code; this adapter is deleted once every call
 * site has moved.
 */
export function ModuleDropdown(props: TModuleDropdownProps) {
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className,
    disabled = false,
    onClose,
    placeholder = "",
    placement,
    projectId,
    showTooltip = false,
    tabIndex,
  } = props;
  // derived values
  const variant = LEGACY_BUTTON_SELECT_VARIANT[buttonVariant];
  const triggerClassName = cn("clickable", buttonContainerClassName, buttonClassName);

  return (
    <LegacyDropdownContainer className={className} placement={placement}>
      {props.multiple ? (
        <ModuleSelect
          multiple
          projectId={projectId}
          value={props.value ?? []}
          onChange={props.onChange}
          variant={variant}
          disabled={disabled}
          placeholder={placeholder}
          onClose={onClose}
          className={triggerClassName}
          tooltip={showTooltip}
          tabIndex={tabIndex}
        />
      ) : (
        <ModuleSelect
          projectId={projectId}
          value={props.value}
          onChange={props.onChange}
          variant={variant}
          disabled={disabled}
          placeholder={placeholder}
          onClose={onClose}
          className={triggerClassName}
          tooltip={showTooltip}
          tabIndex={tabIndex}
        />
      )}
    </LegacyDropdownContainer>
  );
}
