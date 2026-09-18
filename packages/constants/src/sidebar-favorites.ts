/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IFavorite } from "@plane/types";

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
};
