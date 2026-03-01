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

import { lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { observer } from "mobx-react";
// hooks
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states";
// types
import { EProjectLayouts } from "@/types/workspace-project-filters";

const ProjectBoardLayout = lazy(() =>
  import("./board/root").then((module) => ({ default: module.ProjectBoardLayout }))
);
const BaseTimelineRoot = lazy(() =>
  import("./timeline/base-timeline-root").then((module) => ({ default: module.BaseTimelineRoot }))
);
const BaseProjectRoot = lazy(() =>
  import("./gallery/base-gallery-root").then((module) => ({ default: module.BaseProjectRoot }))
);
const BaseListRoot = lazy(() => import("./list/base-list-root").then((module) => ({ default: module.BaseListRoot })));

const PROJECT_LAYOUT_MAP: Record<EProjectLayouts, LazyExoticComponent<ComponentType>> = {
  [EProjectLayouts.BOARD]: ProjectBoardLayout,
  [EProjectLayouts.TIMELINE]: BaseTimelineRoot,
  [EProjectLayouts.GALLERY]: BaseProjectRoot,
  [EProjectLayouts.TABLE]: BaseListRoot,
};

export const ProjectLayoutRoot = observer(function ProjectLayoutRoot() {
  const { filters } = useProjectFilter();
  // derived values
  const currentLayout = filters?.layout;
  const ProjectLayoutComponent = currentLayout ? PROJECT_LAYOUT_MAP[currentLayout] : undefined;

  if (!ProjectLayoutComponent) return <></>;
  return (
    <Suspense>
      <ProjectLayoutComponent />
    </Suspense>
  );
});
