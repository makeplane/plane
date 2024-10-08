// plane types
import { IFavorite } from "@plane/types";
// components
import {
  generateFavoriteItemLink,
  getFavoriteItemIcon,
} from "@/components/workspace/sidebar/favorites/favorite-items/common";
// helpers
import { getPageName } from "@/helpers/page.helper";
// hooks
import { useProject, usePage, useProjectView, useCycle, useModule } from "@/hooks/store";

export const useFavoriteItemDetails = (workspaceSlug: string, favorite: IFavorite) => {
  const favoriteItemId = favorite?.entity_data?.id;
  const favoriteItemLogoProps = favorite?.entity_data?.logo_props;
  const favoriteItemName = favorite?.entity_data?.name || favorite?.name;
  const favoriteItemEntityType = favorite?.entity_type;

  // store hooks
  const { getViewById } = useProjectView();
  const { getProjectById } = useProject();
  const { getCycleById } = useCycle();
  const { getModuleById } = useModule();

  // derived values
  const pageDetail = usePage(favoriteItemId ?? "");
  const viewDetails = getViewById(favoriteItemId ?? "");
  const cycleDetail = getCycleById(favoriteItemId ?? "");
  const moduleDetail = getModuleById(favoriteItemId ?? "");

  const currentProjectDetails = getProjectById(favorite.project_id ?? "");

  let itemIcon;
  let itemTitle;
  const itemLink = generateFavoriteItemLink(workspaceSlug.toString(), favorite);

  switch (favoriteItemEntityType) {
    case "project":
      itemTitle = currentProjectDetails?.name || favoriteItemName;
      itemIcon = getFavoriteItemIcon("project", currentProjectDetails?.logo_props || favoriteItemLogoProps);
      break;
    case "page":
      itemTitle = getPageName(pageDetail.name || favoriteItemName);
      itemIcon = getFavoriteItemIcon("page", pageDetail?.logo_props || favoriteItemLogoProps);
      break;
    case "view":
      itemTitle = viewDetails?.name || favoriteItemName;
      itemIcon = getFavoriteItemIcon("view", viewDetails?.logo_props || favoriteItemLogoProps);
      break;
    case "cycle":
      itemTitle = cycleDetail?.name || favoriteItemName;
      itemIcon = getFavoriteItemIcon("cycle");
      break;
    case "module":
      itemTitle = moduleDetail?.name || favoriteItemName;
      itemIcon = getFavoriteItemIcon("module");
      break;
    default:
      itemTitle = favoriteItemName;
      itemIcon = getFavoriteItemIcon(favoriteItemEntityType);
      break;
  }

  return { itemIcon, itemTitle, itemLink };
};
