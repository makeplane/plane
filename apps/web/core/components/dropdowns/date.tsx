/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { isValidElement } from "react";
import { observer } from "mobx-react";
// plane imports
import { toSideAndAlign } from "@plane/blocks/common";
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
import { CalendarOutline } from "@makeplane/propel/icons";
import { cn, getDate } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { LEGACY_BUTTON_SELECT_VARIANT } from "./constants";
import { LegacyDropdownContainer } from "./legacy-dropdown-container";
import type { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  /** @deprecated No effect — clearing moved to the calendar's "Clear" footer. */
  clearIconClassName?: string;
  defaultOpen?: boolean;
  /** @deprecated No effect — the popover sizes itself. */
  optionsClassName?: string;
  /** Leading trigger icon. Defaults to a calendar; `null` renders none. */
  icon?: ReactNode;
  /** Offers the calendar's "Clear" footer action. Defaults to `true`. */
  isClearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  onChange: (val: Date | null) => void;
  onClose?: () => void;
  value: Date | string | null;
  /** @deprecated No effect — picking a day always closes the calendar. */
  closeOnSelect?: boolean;
  formatToken?: string;
  /** @deprecated No effect — the calendar mounts on first click. */
  renderByDefault?: boolean;
  /** @deprecated No effect — the label takes the trigger's type scale. */
  labelClassName?: string;
};

/**
 * @deprecated Phase-A adapter (critic C15) over the `DateSelect` block. Call sites move to
 * `DateSelect` from `@plane/blocks/property-select` directly, passing
 * `weekStartsOn={userProfile?.start_of_the_week}`; this adapter is deleted once every call site has
 * moved.
 */
export const DateDropdown = observer(function DateDropdown(props: Props) {
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className,
    defaultOpen = false,
    disabled = false,
    hideIcon = false,
    icon = <CalendarOutline />,
    isClearable = true,
    minDate,
    maxDate,
    onChange,
    onClose,
    placeholder = "Date",
    placement,
    showTooltip = false,
    tabIndex,
    value,
    formatToken,
  } = props;
  // store hooks
  const { data: userProfile } = useUserProfile();
  // translation
  const { t } = useTranslation();
  // derived values
  const triggerIcon = !hideIcon && isValidElement<{ className?: string }>(icon) ? icon : undefined;
  const sideAndAlign = placement ? toSideAndAlign(placement) : undefined;

  return (
    <LegacyDropdownContainer className={className}>
      <DateSelect
        value={getDate(value) ?? null}
        onChange={onChange}
        variant={LEGACY_BUTTON_SELECT_VARIANT[buttonVariant]}
        placeholder={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        clearable={isClearable}
        clearLabel={t("common.clear")}
        formatToken={formatToken}
        weekStartsOn={userProfile?.start_of_the_week}
        icon={triggerIcon}
        className={cn("clickable", buttonContainerClassName, buttonClassName)}
        showTooltip={showTooltip}
        tooltipHeading={placeholder}
        tooltipEmptyContent={t("common.none")}
        onClose={onClose}
        tabIndex={tabIndex}
        defaultOpen={defaultOpen}
        side={sideAndAlign?.side}
        align={sideAndAlign?.align}
      />
    </LegacyDropdownContainer>
  );
});
