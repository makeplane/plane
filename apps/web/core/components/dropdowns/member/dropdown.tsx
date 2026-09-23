/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentType, SVGProps } from "react";
import { observer } from "mobx-react";
// plane imports
import type { MemberSelectVariant } from "@plane/blocks/property-select";
import type { SelectTooltip } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// local imports
import { BUTTON_VARIANTS_WITHOUT_TEXT, LEGACY_BUTTON_SELECT_VARIANT } from "../constants";
import { LegacyDropdownContainer } from "../legacy-dropdown-container";
import type { TButtonVariants } from "../types";
import { MemberSelect } from "./member-select";
import type { MemberDropdownProps } from "./types";

type TMemberDropdownProps = {
  /** @deprecated No effect — the trigger draws its own empty-state icon. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  memberIds?: string[];
  onClose?: () => void;
  /** @deprecated No effect — the popup sizes itself. */
  optionsClassName?: string;
  projectId?: string;
  /** @deprecated No effect — the Select mounts lazily on first click. */
  renderByDefault?: boolean;
} & MemberDropdownProps;

/**
 * The legacy text-less variants drew avatars only. A selection keeps that as `avatar-group-sm`; an
 * empty one keeps the variant's own empty chrome (a `pill-sm` chip, or the icon-only trigger).
 */
function getMemberSelectVariant(buttonVariant: TButtonVariants, hasValue: boolean): MemberSelectVariant {
  if (BUTTON_VARIANTS_WITHOUT_TEXT.includes(buttonVariant) && hasValue) return "avatar-group-sm";
  return LEGACY_BUTTON_SELECT_VARIANT[buttonVariant];
}

/**
 * @deprecated Phase-A adapter (critic C15) over the `MemberSelect` binding in `./member-select`.
 * Use `MemberSelect` with an explicit `variant` in new code; this adapter is deleted once every call
 * site has moved.
 */
export const MemberDropdown = observer(function MemberDropdown(props: TMemberDropdownProps) {
  // translation
  const { t } = useTranslation();
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className,
    disabled = false,
    memberIds,
    onClose,
    placeholder = t("members"),
    placement,
    projectId,
    showTooltip = false,
    showUserDetails = false,
    tabIndex,
    tooltipContent,
  } = props;
  // derived values
  const selectedCount = props.multiple ? (props.value?.length ?? 0) : props.value ? 1 : 0;
  const variant = getMemberSelectVariant(buttonVariant, selectedCount > 0);
  const tooltip: SelectTooltip = showTooltip && { heading: placeholder, emptyContent: tooltipContent || undefined };
  const triggerClassName = cn("clickable", buttonContainerClassName, buttonClassName);

  return (
    <LegacyDropdownContainer className={className} placement={placement}>
      {props.multiple ? (
        <MemberSelect
          multiple
          projectId={projectId}
          memberIds={memberIds}
          value={props.value ?? []}
          onChange={props.onChange}
          variant={variant}
          // The legacy trigger named one member, and summarised several as a count only with `showUserDetails`.
          showLabel={selectedCount > 1 && !showUserDetails ? false : undefined}
          disabled={disabled}
          placeholder={placeholder}
          onClose={onClose}
          className={triggerClassName}
          tooltip={tooltip}
          tabIndex={tabIndex}
        />
      ) : (
        <MemberSelect
          projectId={projectId}
          memberIds={memberIds}
          value={props.value}
          onChange={(id) => props.onChange(id || null)}
          variant={variant}
          disabled={disabled}
          placeholder={placeholder}
          onClose={onClose}
          className={triggerClassName}
          tooltip={tooltip}
          tabIndex={tabIndex}
        />
      )}
    </LegacyDropdownContainer>
  );
});
