/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { memo } from "react";
import { ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { IconButton } from "@plane/propel/icon-button";
import type { IconButtonProps } from "@plane/propel/icon-button";

export type ActivitySortRootProps = {
  sortOrder: E_SORT_ORDER;
  toggleSort: () => void;
  variant?: IconButtonProps["variant"];
};
export const ActivitySortRoot = memo(function ActivitySortRoot(props: ActivitySortRootProps) {
  const SortIcon = props.sortOrder === E_SORT_ORDER.ASC ? ArrowUpWideNarrow : ArrowDownWideNarrow;
  return <IconButton variant={props.variant || "tertiary"} icon={SortIcon} onClick={props.toggleSort} />;
});

ActivitySortRoot.displayName = "ActivitySortRoot";
