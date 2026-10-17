/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Badge, BadgeLabel } from "@makeplane/propel/elements/badge";
import type { IconSource } from "@makeplane/propel/components/icon";
import { Icon } from "@makeplane/propel/components/icon";
import { Tooltip } from "@makeplane/propel/components/tooltip";

type Props = {
  icon: IconSource;
  label?: string;
  tooltip: string;
  shouldShowBorder?: boolean;
  danger?: boolean;
};

/** Published properties are display values, so use Badge rather than an interactive Pill. */
export function ReadOnlyProperty({ icon, label, tooltip, shouldShowBorder = true, danger = false }: Props) {
  const accessibleProps = label ? {} : { role: "img", "aria-label": tooltip };

  return (
    <Tooltip label={tooltip}>
      {shouldShowBorder ? (
        <Badge
          size="sm"
          variant={danger ? "danger" : "neutral"}
          render={<span className="max-w-56 min-w-0 overflow-hidden" />}
          {...accessibleProps}
        >
          <Icon icon={icon} />
          {label && <BadgeLabel render={<span className="truncate" />}>{label}</BadgeLabel>}
        </Badge>
      ) : (
        <span
          className={`inline-flex max-w-56 min-w-0 items-center gap-1.5 text-caption-md-regular ${danger ? "text-danger-primary" : "text-secondary"}`}
          {...accessibleProps}
        >
          <Icon icon={icon} size="sm" />
          {label && <span className="truncate">{label}</span>}
        </span>
      )}
    </Tooltip>
  );
}
