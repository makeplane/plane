/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import type { IGanttBlock } from "@plane/types";

type RightDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};
export function RightDependencyDraggable(props: RightDependencyDraggableProps) {
  return <></>;
}
