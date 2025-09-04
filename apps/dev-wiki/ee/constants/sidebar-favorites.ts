import { Briefcase, FileText, Layers, LucideIcon, LayoutGrid } from "lucide-react";
// plane imports
import { ContrastIcon, DiceIcon, FavoriteFolderIcon, ISvgIcons } from "@plane/propel/icons";
import { IFavorite } from "@plane/types";

export const FAVORITE_ITEM_ICONS: Record<string, React.FC<ISvgIcons> | LucideIcon> = {
  page: FileText,
  project: Briefcase,
  view: Layers,
  module: DiceIcon,
  cycle: ContrastIcon,
  folder: FavoriteFolderIcon,
  workspace_dashboard: LayoutGrid,
};

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
  workspace_dashboard: {
    itemLevel: "workspace",
    getLink: (favorite) => `dashboards/${favorite.entity_identifier}`,
  },
};
