/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment } from "react";
import type { WorkItemPropertyEntry } from "./types";

export type WorkItemPropertiesListProps = {
  /** Property entries in row order, already filtered to the ones shown. Only `key` and `chip` are used. */
  entries: Pick<WorkItemPropertyEntry, "key" | "chip">[];
  /** Classes for the chip container, e.g. `flex flex-wrap items-center gap-2`. */
  className?: string;
};

/**
 * Every property chip of a work item in row order, wrapping as the container allows — for board
 * cards and other places with no width budget. Unlike `PropertiesOverflowRow` it never measures or
 * collapses chips, so it adds no observers per card.
 */
export function WorkItemPropertiesList(props: WorkItemPropertiesListProps) {
  const { entries, className } = props;

  return (
    <div className={className}>
      {entries.map((entry) => (
        <Fragment key={entry.key}>{entry.chip}</Fragment>
      ))}
    </div>
  );
}
