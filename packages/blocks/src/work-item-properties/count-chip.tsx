/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type * as React from "react";
import { Icon } from "@makeplane/propel/components/icon";
import { Pill } from "@makeplane/propel/components/pill";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Pill as PillElement, PillLabel } from "@makeplane/propel/elements/pill";

export type WorkItemPropertyCountChipProps = {
  /** The property glyph, e.g. `SubWorkItemsOutline`; rendered at the chip's icon size. */
  icon: React.ComponentProps<typeof Icon>["icon"];
  count: number;
  /** Translated property name, e.g. "Attachments". Tooltip and accessible name read "<label>: <count>". */
  label: string;
  /** Makes the chip a button. Omit for a display-only chip (e.g. public boards). */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  /** Hides the tooltip, e.g. on touch devices. */
  tooltipDisabled?: boolean;
};

/**
 * An outlined count chip for a work item's sub-work items, attachments or links. With `onClick` it
 * is a button; without, it is a display-only chip that is not focusable.
 */
export function WorkItemPropertyCountChip(props: WorkItemPropertyCountChipProps) {
  const { icon, count, label, onClick, onFocus, tooltipDisabled = false } = props;
  const accessibleName = `${label}: ${count}`;

  return (
    <Tooltip label={accessibleName} disabled={tooltipDisabled}>
      {onClick ? (
        <Pill
          size="sm"
          aria-label={accessibleName}
          label={`${count}`}
          startIcon={<Icon icon={icon} />}
          onClick={onClick}
          onFocus={onFocus}
        />
      ) : (
        <PillElement
          size="sm"
          variant="outline"
          aria-label={accessibleName}
          render={(pillProps) => {
            // A display-only chip is a span, so it takes no button `type` and no focus.
            const { type: _buttonType, ...spanProps } = pillProps as typeof pillProps & { type?: string };
            return <span {...spanProps} role="img" className={`${spanProps.className ?? ""} cursor-[inherit]`} />;
          }}
        >
          <Icon icon={icon} />
          <PillLabel>{count}</PillLabel>
        </PillElement>
      )}
    </Tooltip>
  );
}
