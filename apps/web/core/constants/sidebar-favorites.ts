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

import {
  DashboardIcon,
  CycleIcon,
  FavoriteFolderIcon,
  ModuleIcon,
  PageIcon,
  ProjectIcon,
  ViewsIcon,
} from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import type { IFavorite } from "@plane/types";

export const FAVORITE_ITEM_ICONS: Record<string, React.FC<ISvgIcons>> = {
  page: PageIcon,
  project: ProjectIcon,
  view: ViewsIcon,
  module: ModuleIcon,
  cycle: CycleIcon,
  folder: FavoriteFolderIcon,
  workspace_dashboard: DashboardIcon,
};

export const FAVORITE_ITEM_LINKS: {
  [key: string]: {
    itemLevel: "project" | "workspace";
    getLink: (favorite: IFavorite) => string;
  };
} = {
  project: {
    itemLevel: "project",
    getLink: () => `issues`,
  },
  cycle: {
    itemLevel: "project",
    getLink: (favorite) => `cycles/${favorite.entity_identifier}`,
  },
  module: {
    itemLevel: "project",
    getLink: (favorite) => `modules/${favorite.entity_identifier}`,
  },
  view: {
    itemLevel: "project",
    getLink: (favorite) => `views/${favorite.entity_identifier}`,
  },
  page: {
    itemLevel: "project",
    getLink: (favorite) => `pages/${favorite.entity_identifier}`,
  },
  workspace_dashboard: {
    itemLevel: "workspace",
    getLink: (favorite) => `dashboards/${favorite.entity_identifier}`,
  },
};
