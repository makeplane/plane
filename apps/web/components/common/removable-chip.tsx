/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ComboboxChip } from "@makeplane/propel/elements/combobox";
import type { ComboboxChipSize } from "@makeplane/propel/elements/combobox";
import { CloseOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

export type TRemovableChipVariant = "outline" | "soft";

// `outline` keeps the chip's own bordered layer-2 surface; `soft` drops the border and sits one
// layer up, for chips nested inside an already bordered layer-2 filter group.
const VARIANT_CLASSNAMES: Record<TRemovableChipVariant, string> = {
  outline: "",
  soft: "border-transparent bg-layer-3",
};

type Props = {
  /** Shown before the label: an avatar, a state or priority icon, a colour dot… */
  icon?: ReactNode;
  label: ReactNode;
  /** Plain-text name of the value, used to name the remove control. */
  ariaLabel: string;
  /** @default "outline" */
  variant?: TRemovableChipVariant;
  /** @default "xs" */
  size?: ComboboxChipSize;
  /** Leave out for a read-only chip without a remove control. */
  onRemove?: () => void;
  className?: string;
};

/**
 * A selected value shown as a chip, with a remove control unless it is read-only — the chip every
 * applied-filters row renders for each of its values.
 */
export function RemovableChip(props: Props) {
  const { icon, label, ariaLabel, variant = "outline", size = "xs", onRemove, className } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <ComboboxChip
      size={size}
      // merged through `cn` so the variant's surface replaces the chip's own instead of competing with it
      render={(chipProps) => (
        <div
          {...chipProps}
          className={cn(chipProps.className, VARIANT_CLASSNAMES[variant], !onRemove && "pe-1.5", className)}
        />
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate normal-case">{label}</span>
      {onRemove && (
        <IconButton
          type="button"
          variant="ghost"
          size="xs"
          aria-label={ariaLabel ? `${t("aria_labels.common.remove")}: ${ariaLabel}` : t("aria_labels.common.remove")}
          onClick={onRemove}
          icon={<Icon icon={CloseOutline} />}
        />
      )}
    </ComboboxChip>
  );
}

/**
 * The bordered frame one applied filter sits in: the property name, its value chips (the `soft`
 * variant) and the control that clears the property.
 */
export const APPLIED_FILTER_GROUP_CLASSNAME =
  "my-auto flex min-h-7 flex-wrap items-center gap-1.5 rounded-md border border-subtle-1 bg-layer-2 p-2 py-0.5 text-caption-sm-regular text-tertiary hover:text-secondary";
