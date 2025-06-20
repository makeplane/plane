import { Briefcase, FileText, Layers, LucideIcon } from "lucide-react";
// plane imports
import { IFavorite } from "@plane/types";
import { ContrastIcon, DiceIcon, FavoriteFolderIcon, ISvgIcons } from "@plane/ui";

export const FAVORITE_ITEM_ICONS: Record<string, React.FC<ISvgIcons> | LucideIcon> = {
  page: FileText,
  project: Briefcase,
  view: Layers,
  module: DiceIcon,
  cycle: ContrastIcon,
  folder: FavoriteFolderIcon,
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
};
