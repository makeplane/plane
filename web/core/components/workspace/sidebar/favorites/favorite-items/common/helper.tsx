"use client";
// lucide
import { Briefcase, FileText, Layers } from "lucide-react";
// types
import { IFavorite, TLogoProps } from "@plane/types";
// ui
import { ContrastIcon, DiceIcon, FavoriteFolderIcon } from "@plane/ui";
import { Logo } from "@/components/common";

const iconClassName = `flex-shrink-0 size-4 stroke-[1.5] m-auto`;

export const FAVORITE_ITEM_ICON: Record<string, JSX.Element> = {
  page: <FileText className={iconClassName} />,
  project: <Briefcase className={iconClassName} />,
  view: <Layers className={iconClassName} />,
  module: <DiceIcon className={iconClassName} />,
  cycle: <ContrastIcon className={iconClassName} />,
  folder: <FavoriteFolderIcon className={iconClassName} />,
};

export const getFavoriteItemIcon = (type: string, logo?: TLogoProps | undefined) => (
  <>
    <div className="hidden group-hover:flex items-center justify-center size-5">
      {FAVORITE_ITEM_ICON[type] || <FileText />}
    </div>
    <div className="flex items-center justify-center size-5 group-hover:hidden">
      {logo?.in_use ? (
        <Logo logo={logo} size={16} type={type === "project" ? "material" : "lucide"} />
      ) : (
        FAVORITE_ITEM_ICON[type] || <FileText />
      )}
    </div>
  </>
);

export const generateFavoriteItemLink = (workspaceSlug: string, favorite: IFavorite) => {
  switch (favorite.entity_type) {
    case "project":
      return `/${workspaceSlug}/projects/${favorite.project_id}/issues`;
    case "cycle":
      return `/${workspaceSlug}/projects/${favorite.project_id}/cycles/${favorite.entity_identifier}`;
    case "module":
      return `/${workspaceSlug}/projects/${favorite.project_id}/modules/${favorite.entity_identifier}`;
    case "view":
      return `/${workspaceSlug}/projects/${favorite.project_id}/views/${favorite.entity_identifier}`;
    case "page":
      return `/${workspaceSlug}/projects/${favorite.project_id}/pages/${favorite.entity_identifier}`;
    default:
      return `/${workspaceSlug}`;
  }
};
