"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { IFavorite } from "@plane/types";
// components
import { FavoriteRoot } from "@/components/workspace/sidebar/favorites";
// hooks
import { useFavoriteItemDetails } from "@/hooks/use-favorite-item-details";

type Props = {
  workspaceSlug: string;
  favorite: IFavorite;
  favoriteMap: Record<string, IFavorite>;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleRemoveFromFavoritesFolder: (favoriteId: string) => void;
};

export const FavoriteItemDetail: FC<Props> = observer((props) => {
  const { workspaceSlug, favorite, favoriteMap, handleRemoveFromFavorites, handleRemoveFromFavoritesFolder } = props;
  // hooks
  const { itemLink, itemIcon, itemTitle } = useFavoriteItemDetails(workspaceSlug, favorite);

  return (
    <FavoriteRoot
      itemLink={itemLink}
      itemIcon={itemIcon}
      itemTitle={itemTitle}
      favorite={favorite}
      favoriteMap={favoriteMap}
      handleRemoveFromFavorites={handleRemoveFromFavorites}
      handleRemoveFromFavoritesFolder={handleRemoveFromFavoritesFolder}
    />
  );
});
