/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { observer } from "mobx-react";
import type { IGanttBlock } from "@plane/types";
import { DependencySideDraggable } from "./dependency-side-draggable";

type Props = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};

export const LeftDependencyDraggable = observer(function LeftDependencyDraggable(props: Props) {
  return <DependencySideDraggable {...props} side="left" />;
});
