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

import type { TBaseLayoutType } from "@plane/types";
import { TimelineLayoutLoader } from "@/components/ui/loader/layouts/timeline-layout-loader";
import { KanbanLayoutLoader } from "@/components/ui/loader/layouts/kanban-layout-loader";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";

interface GenericLayoutLoaderProps {
  layout: TBaseLayoutType;
  /** Optional custom loaders to override defaults */
  customLoaders?: Partial<Record<TBaseLayoutType, React.ComponentType>>;
}

export function GenericLayoutLoader({ layout, customLoaders }: GenericLayoutLoaderProps) {
  const CustomLoader = customLoaders?.[layout];
  if (CustomLoader) return <CustomLoader />;

  switch (layout) {
    case "list":
      return <ListLayoutLoader />;
    case "kanban":
      return <KanbanLayoutLoader />;
    case "gantt":
      return <TimelineLayoutLoader />;
    default:
      console.warn(`Unknown layout: ${layout}`);
      return null;
  }
}
