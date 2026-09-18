/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueLayout } from "@plane/constants";
import { BoardOutline, ListOutline } from "@makeplane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";

export function IssueLayoutIcon({
  layout,
  size,
  ...props
}: { layout: TIssueLayout; size?: number } & Omit<ISvgIcons, "width" | "height">) {
  const iconProps = {
    ...props,
    ...(size && { width: size, height: size }),
  };

  switch (layout) {
    case "list":
      return <ListOutline {...iconProps} />;
    case "kanban":
      return <BoardOutline {...iconProps} />;
    default:
      return null;
  }
}
