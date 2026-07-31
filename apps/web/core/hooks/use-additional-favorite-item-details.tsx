/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { IFavorite } from "@plane/types";
// components
import { FavoriteItemIcon } from "@/components/workspace/sidebar/favorites/favorite-items/common";

const getAdditionalFavoriteItemDetails = (_workspaceSlug: string, favorite: IFavorite) => {
  const { entity_type: favoriteItemEntityType } = favorite;
  const favoriteItemName = favorite?.entity_data?.name || favorite?.name;

  let itemIcon;
  let itemTitle;

  switch (favoriteItemEntityType) {
    default:
      itemTitle = favoriteItemName;
      itemIcon = <FavoriteItemIcon type={favoriteItemEntityType} logo={favorite.entity_data?.logo_props} />;
      break;
  }
  return { itemIcon, itemTitle };
};

export const useAdditionalFavoriteItemDetails = () => ({
  getAdditionalFavoriteItemDetails,
});
