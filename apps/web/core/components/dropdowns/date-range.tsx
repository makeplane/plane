/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { toSideAndAlign } from "@plane/blocks/common";
import type { TPopoverMenuPlacement } from "@plane/blocks/common";
import { DateRangeSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
import { CalendarOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { LEGACY_BUTTON_SELECT_VARIANT } from "./constants";
import { LegacyDropdownContainer } from "./legacy-dropdown-container";
import type { TButtonVariants } from "./types";

// react-day-picker range shape the legacy `onSelect` emitted (not re-exported by @makeplane/propel)
type DateRange = { from: Date | undefined; to?: Date | undefined };

type Props = {
  /** @deprecated No effect. */
  applyButtonText?: string;
  /** @deprecated No effect — the range is emitted once both ends are picked. */
  bothRequired?: boolean;
  buttonClassName?: string;
  buttonContainerClassName?: string;
  /** @deprecated No effect — the range renders as one label. */
  buttonFromDateClassName?: string;
  /** @deprecated No effect — the range renders as one label. */
  buttonToDateClassName?: string;
  buttonVariant: TButtonVariants;
  /** @deprecated No effect. */
  cancelButtonText?: string;
  className?: string;
  /** @deprecated No effect — clearing moved to the calendar's "Clear" footer. */
  clearIconClassName?: string;
  disabled?: boolean;
  /** Hides the leading calendar icon. Both ends default to hidden; the range shows one icon. */
  hideIcon?: {
    from?: boolean;
    to?: boolean;
  };
  isClearable?: boolean;
  mergeDates?: boolean;
  minDate?: Date;
  maxDate?: Date;
  /** Fires once both ends are picked, and with both ends unset when the range is cleared. */
  onSelect?: (range: DateRange | undefined) => void;
  placeholder?: {
    from?: string;
    to?: string;
  };
  placement?: TPopoverMenuPlacement;
  /** @deprecated No effect. */
  required?: boolean;
  showTooltip?: boolean;
  tabIndex?: number;
  value: {
    from: Date | undefined;
    to: Date | undefined;
  };
  /** @deprecated No effect — the calendar mounts on first click. */
  renderByDefault?: boolean;
  /** Shows the placeholder while no date is set. Defaults to `true`. */
  renderPlaceholder?: boolean;
  customTooltipContent?: string;
  customTooltipHeading?: string;
  defaultOpen?: boolean;
  /** @deprecated No effect — the calendar is always portaled. */
  renderInPortal?: boolean;
};

/**
 * @deprecated Phase-A adapter (critic C15) over the `DateRangeSelect` block. Call sites move to
 * `DateRangeSelect` from `@plane/blocks/property-select` directly, passing
 * `weekStartsOn={userProfile?.start_of_the_week}`; this adapter is deleted once every call site has
 * moved.
 */
export const DateRangeDropdown = observer(function DateRangeDropdown(props: Props) {
  const { t } = useTranslation();
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className,
    disabled = false,
    hideIcon = {
      from: true,
      to: true,
    },
    isClearable = false,
    mergeDates,
    minDate,
    maxDate,
    onSelect,
    placeholder = {
      from: t("project_cycles.add_date"),
      to: t("project_cycles.add_date"),
    },
    placement,
    showTooltip = false,
    tabIndex,
    value,
    renderPlaceholder = true,
    customTooltipContent,
    customTooltipHeading,
    defaultOpen = false,
  } = props;
  // store hooks
  const { data: userProfile } = useUserProfile();
  // derived values
  const showIcon = hideIcon.from === false || hideIcon.to === false;
  // The two legacy placeholders become one label: "Start date - End date", or the shared text once.
  const placeholderText = renderPlaceholder
    ? [...new Set([placeholder.from, placeholder.to].filter((text): text is string => !!text))].join(" - ")
    : "";
  const sideAndAlign = placement ? toSideAndAlign(placement) : undefined;

  return (
    <LegacyDropdownContainer className={className}>
      <DateRangeSelect
        value={{ from: value.from ?? null, to: value.to ?? null }}
        onChange={(range) => onSelect?.({ from: range.from ?? undefined, to: range.to ?? undefined })}
        variant={LEGACY_BUTTON_SELECT_VARIANT[buttonVariant]}
        placeholder={placeholderText}
        mergeDates={mergeDates}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        clearable={isClearable}
        clearLabel={t("common.clear")}
        weekStartsOn={userProfile?.start_of_the_week}
        icon={showIcon ? <CalendarOutline /> : undefined}
        className={cn("clickable", buttonContainerClassName, buttonClassName)}
        showTooltip={showTooltip}
        tooltipHeading={customTooltipHeading ?? t("project_cycles.date_range")}
        tooltipContent={customTooltipContent}
        tabIndex={tabIndex}
        defaultOpen={defaultOpen}
        side={sideAndAlign?.side}
        align={sideAndAlign?.align}
      />
    </LegacyDropdownContainer>
  );
});
