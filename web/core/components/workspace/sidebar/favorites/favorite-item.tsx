"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { IFavorite } from "@plane/types";
// components
import { FavoriteCycle, FavoriteModule, FavoritePage, FavoriteProject, FavoriteView } from "./favorite-items";

type Props = {
  favorite: IFavorite;
  favoriteMap: Record<string, IFavorite>;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleRemoveFromFavoritesFolder: (favoriteId: string) => void;
};

type EntityType = keyof typeof favoriteComponents;

const favoriteComponents = {
  page: FavoritePage,
  project: FavoriteProject,
  view: FavoriteView,
  module: FavoriteModule,
  cycle: FavoriteCycle,
};

export const FavoriteItem: FC<Props> = observer((props) => {
  const { favorite, favoriteMap, handleRemoveFromFavorites, handleRemoveFromFavoritesFolder } = props;
  // component based on the entity type
  const FavoriteComponent = favoriteComponents[favorite.entity_type as EntityType];

  return (
    <>
      {FavoriteComponent ? (
        <FavoriteComponent
          favorite={favorite}
          favoriteMap={favoriteMap}
          handleRemoveFromFavorites={handleRemoveFromFavorites}
          handleRemoveFromFavoritesFolder={handleRemoveFromFavoritesFolder}
        />
      ) : null}
    </>
  );
});
