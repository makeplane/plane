/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { PrioritySelect as PrioritySelectBlock } from "@plane/blocks/property-select";
import type { SelectTooltip, SelectTooltipOverride, SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { TIssuePriorities } from "@plane/types";

type PrioritySelectWebProps = {
  /** value-agnostic e2e selector — forwarded to the block's trigger as data-testid */
  testId?: string;
  /** Current priority key (`null` / `undefined` when none). */
  value: TIssuePriorities | null | undefined;
  /** Emits the next priority key. */
  onChange: (value: TIssuePriorities) => void;
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
  className?: string;
  tooltip?: SelectTooltip;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
};

/**
 * Web binding for the presentational `PrioritySelect` block. Priorities are a hardcoded list, so
 * there is no data source to resolve — this wrapper only supplies the localized default placeholder.
 */
export function PrioritySelect(props: PrioritySelectWebProps) {
  const { placeholder, tooltip, ...rest } = props;
  const { t } = useTranslation();

  const resolvedTooltip = useMemo<SelectTooltipOverride | undefined>(() => {
    if (!tooltip) return undefined;
    const override = typeof tooltip === "object" ? tooltip : undefined;
    return {
      heading: override?.heading ?? t("common.priority"),
      emptyContent: override?.emptyContent ?? t("common.none"),
    };
  }, [tooltip, t]);

  return <PrioritySelectBlock placeholder={placeholder ?? t("common.priority")} tooltip={resolvedTooltip} {...rest} />;
}
