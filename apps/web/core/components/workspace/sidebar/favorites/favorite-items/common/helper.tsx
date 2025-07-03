"use client";

import { FileText } from "lucide-react";
// plane imports
import { IFavorite, TLogoProps } from "@plane/types";
// components
import { Logo } from "@/components/common";
// plane web constants
import { FAVORITE_ITEM_ICONS, FAVORITE_ITEM_LINKS } from "@/plane-web/constants";

export const getFavoriteItemIcon = (type: string, logo?: TLogoProps | undefined) => {
  const Icon = FAVORITE_ITEM_ICONS[type] || FileText;

  return (
    <>
      <div className="hidden group-hover:flex items-center justify-center size-5">
        <Icon className="flex-shrink-0 size-4 stroke-[1.5] m-auto" />
      </div>
      <div className="flex items-center justify-center size-5 group-hover:hidden">
        {logo?.in_use ? (
          <Logo logo={logo} size={16} type={type === "project" ? "material" : "lucide"} />
        ) : (
          <Icon className="flex-shrink-0 size-4 stroke-[1.5] m-auto" />
        )}
      </div>
    </>
  );
};

export const generateFavoriteItemLink = (workspaceSlug: string, favorite: IFavorite) => {
  const entityLinkDetails = FAVORITE_ITEM_LINKS[favorite.entity_type];

  if (!entityLinkDetails) {
    console.error(`Unrecognized favorite entity type: ${favorite.entity_type}`);
    return `/${workspaceSlug}`;
  }

  if (entityLinkDetails.itemLevel === "workspace") {
    return `/${workspaceSlug}/${entityLinkDetails.getLink(favorite)}`;
  } else if (entityLinkDetails.itemLevel === "project") {
    return `/${workspaceSlug}/projects/${favorite.project_id}/${entityLinkDetails.getLink(favorite)}`;
  } else {
    return `/${workspaceSlug}`;
  }
};
