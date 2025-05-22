// plane imports
import { IFavorite } from "@plane/types";
// components
import { getPageName } from "@plane/utils";
import {
  generateFavoriteItemLink,
  getFavoriteItemIcon,
} from "@/components/workspace/sidebar/favorites/favorite-items/common";
// helpers
// hooks
import { useProject, useProjectView, useCycle, useModule } from "@/hooks/store";
// plane web hooks
import { EPageStoreType, usePage } from "@/plane-web/hooks/store";
import { useAdditionalFavoriteItemDetails } from "@/plane-web/hooks/use-additional-favorite-item-details";

export const useFavoriteItemDetails = (workspaceSlug: string, favorite: IFavorite) => {
  const {
    entity_identifier: favoriteItemId,
    entity_data: { logo_props: favoriteItemLogoProps },
    entity_type: favoriteItemEntityType,
  } = favorite;
  const favoriteItemName = favorite?.entity_data?.name || favorite?.name;
  // store hooks
  const { getViewById } = useProjectView();
  const { getProjectById } = useProject();
  const { getCycleById } = useCycle();
  const { getModuleById } = useModule();
  // additional details
  const { getAdditionalFavoriteItemDetails } = useAdditionalFavoriteItemDetails();
  // derived values
  const pageDetail = usePage({
    pageId: favoriteItemId ?? "",
    storeType: EPageStoreType.PROJECT,
  });
  const viewDetails = getViewById(favoriteItemId ?? "");
  const cycleDetail = getCycleById(favoriteItemId ?? "");
  const moduleDetail = getModuleById(favoriteItemId ?? "");
  const currentProjectDetails = getProjectById(favorite.project_id ?? "");

  let itemIcon;
  let itemTitle;
  const itemLink = generateFavoriteItemLink(workspaceSlug.toString(), favorite);

  switch (favoriteItemEntityType) {
    case "project":
      itemTitle = currentProjectDetails?.name ?? favoriteItemName;
      itemIcon = getFavoriteItemIcon("project", currentProjectDetails?.logo_props || favoriteItemLogoProps);
      break;
    case "page":
      itemTitle = getPageName(pageDetail?.name ?? favoriteItemName);
      itemIcon = getFavoriteItemIcon("page", pageDetail?.logo_props ?? favoriteItemLogoProps);
      break;
    case "view":
      itemTitle = viewDetails?.name ?? favoriteItemName;
      itemIcon = getFavoriteItemIcon("view", viewDetails?.logo_props || favoriteItemLogoProps);
      break;
    case "cycle":
      itemTitle = cycleDetail?.name ?? favoriteItemName;
      itemIcon = getFavoriteItemIcon("cycle");
      break;
    case "module":
      itemTitle = moduleDetail?.name ?? favoriteItemName;
      itemIcon = getFavoriteItemIcon("module");
      break;
    default: {
      const additionalDetails = getAdditionalFavoriteItemDetails(workspaceSlug, favorite);
      itemTitle = additionalDetails.itemTitle;
      itemIcon = additionalDetails.itemIcon;
      break;
    }
  }

  return { itemIcon, itemTitle, itemLink };
};
