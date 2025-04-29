import { LayoutGrid } from "lucide-react";
// ce constants
import {
  FAVORITE_ITEM_ICONS as CE_FAVORITE_ITEM_ICONS,
  FAVORITE_ITEM_LINKS as CE_FAVORITE_ITEM_LINKS,
} from "@/ce/constants";

export const FAVORITE_ITEM_ICONS: typeof CE_FAVORITE_ITEM_ICONS = {
  ...CE_FAVORITE_ITEM_ICONS,
  workspace_dashboard: LayoutGrid,
};

export const FAVORITE_ITEM_LINKS: typeof CE_FAVORITE_ITEM_LINKS = {
  ...CE_FAVORITE_ITEM_LINKS,
  workspace_dashboard: {
    itemLevel: "workspace",
    getLink: (favorite) => `dashboards/${favorite.entity_identifier}`,
  },
};
