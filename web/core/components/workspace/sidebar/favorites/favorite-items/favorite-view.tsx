"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IFavorite } from "@plane/types";
// components
import { FavoriteRoot } from "@/components/workspace/sidebar/favorites";
// hooks
import { useProjectView } from "@/hooks/store";
// helpers
import { generateFavoriteItemLink, getFavoriteItemIcon } from "./common";

type Props = {
  favorite: IFavorite;
  favoriteMap: Record<string, IFavorite>;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleRemoveFromFavoritesFolder: (favoriteId: string) => void;
};

export const FavoriteView: FC<Props> = observer((props) => {
  const { favorite, favoriteMap, handleRemoveFromFavorites, handleRemoveFromFavoritesFolder } = props;
  // router hooks
  const { workspaceSlug } = useParams();
  // store hooks
  const { getViewById } = useProjectView();
  // derived values
  const viewId = favorite?.entity_data?.id;
  const viewDetails = viewId ? getViewById(viewId) : undefined;

  const logoProps = viewDetails?.logo_props || favorite?.entity_data?.logo_props;

  const itemIcon = getFavoriteItemIcon("view", logoProps);
  const itemTitle = viewDetails?.name || favorite?.entity_data?.name || favorite?.name;
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
