"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IFavorite } from "@plane/types";
// components
import { FavoriteRoot } from "@/components/workspace/sidebar/favorites";
// hooks
import { usePage } from "@/hooks/store";
// helpers
import { generateFavoriteItemLink, getFavoriteItemIcon } from "./common";

type Props = {
  favorite: IFavorite;
  favoriteMap: Record<string, IFavorite>;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleRemoveFromFavoritesFolder: (favoriteId: string) => void;
};

export const FavoritePage: FC<Props> = observer((props) => {
  const { favorite, favoriteMap, handleRemoveFromFavorites, handleRemoveFromFavoritesFolder } = props;
  // router hooks
  const { workspaceSlug } = useParams();
  // store hooks
  const { name, logo_props } = usePage(favorite?.entity_data?.id ?? "");
  // derived values
  const logoProps = logo_props || favorite?.entity_data?.logo_props;

  const itemIcon = getFavoriteItemIcon("page", logoProps);
  const itemTitle = name || favorite?.entity_data?.name || favorite?.name;
  const itemLink = generateFavoriteItemLink(workspaceSlug.toString(), favorite);

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
