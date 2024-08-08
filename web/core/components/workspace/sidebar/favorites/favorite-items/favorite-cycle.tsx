"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IFavorite } from "@plane/types";
// components
import { FavoriteRoot } from "@/components/workspace/sidebar/favorites";
// hooks
import { useCycle } from "@/hooks/store";
// helpers
import { generateFavoriteItemLink, getFavoriteItemIcon } from "./common";

type Props = {
  favorite: IFavorite;
  favoriteMap: Record<string, IFavorite>;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleRemoveFromFavoritesFolder: (favoriteId: string) => void;
};

export const FavoriteCycle: FC<Props> = observer((props) => {
  const { favorite, favoriteMap, handleRemoveFromFavorites, handleRemoveFromFavoritesFolder } = props;
  // router hooks
  const { workspaceSlug } = useParams();
  // store hooks
  const { getCycleById } = useCycle();
  // derived values
  const cycleId = favorite?.entity_data?.id;
  const cycleDetail = cycleId ? getCycleById(cycleId) : undefined;

  const itemIcon = getFavoriteItemIcon("cycle");
  const itemTitle = cycleDetail?.name || favorite?.entity_data?.name || favorite?.name;
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
