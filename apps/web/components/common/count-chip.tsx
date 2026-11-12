/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Badge } from "@makeplane/propel/components/badge";
import { cn } from "@plane/utils";

type TCountChip = {
  count: string | number;
  /** Placement only (margins, alignment): the badge owns its own size and colours. */
  className?: string;
};

export function CountChip(props: TCountChip) {
  const { count, className = "" } = props;

  return (
    <span className={cn("inline-flex flex-shrink-0 items-center", className)}>
      <Badge variant="brand" size="xs" label={String(count)} />
    </span>
  );
}
