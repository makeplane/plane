/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { LEGACY_BUTTON_SELECT_VARIANT } from "../constants";
import { LegacyDropdownContainer } from "../legacy-dropdown-container";
import type { TLegacyStateDropdownProps } from "../state/dropdown";
import { IntakeStateSelect } from "./intake-state-select";

/**
 * @deprecated Phase-A adapter (critic C15) over the `IntakeStateSelect` binding in
 * `./intake-state-select`. Takes the same props as `StateDropdown` (call sites swap the two). The
 * intake state is a project singleton, so an empty `value` always shows it.
 */
export const IntakeStateDropdown = observer(function IntakeStateDropdown(props: TLegacyStateDropdownProps) {
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
    tabIndex,
    value,
  } = props;
  // router params
  const { workspaceSlug } = useParams();

  return (
    <LegacyDropdownContainer className={className} placement={placement}>
      <IntakeStateSelect
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        projectId={projectId ?? ""}
        value={value}
        onChange={onChange}
        variant={LEGACY_BUTTON_SELECT_VARIANT[buttonVariant]}
        disabled={disabled}
        placeholder={placeholder}
        onClose={onClose}
        className={cn("clickable", buttonContainerClassName, buttonClassName)}
        tabIndex={tabIndex}
      />
    </LegacyDropdownContainer>
  );
});
