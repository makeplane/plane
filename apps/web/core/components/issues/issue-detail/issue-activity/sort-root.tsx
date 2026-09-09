/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { memo } from "react";
import { SortAscendingOutline, SortDescendingOutline } from "@makeplane/propel/icons";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

export type TActivitySortRoot = {
  sortOrder: E_SORT_ORDER;
  toggleSort: () => void;
};
export const ActivitySortRoot = memo(function ActivitySortRoot(props: TActivitySortRoot) {
  const SortIcon = props.sortOrder === E_SORT_ORDER.ASC ? SortAscendingOutline : SortDescendingOutline;
  return (
    <IconButton
      variant="tertiary"
      size="sm"
      icon={<Icon icon={SortIcon} />}
      aria-label="Toggle sort order"
      onClick={props.toggleSort}
    />
  );
});

ActivitySortRoot.displayName = "ActivitySortRoot";
