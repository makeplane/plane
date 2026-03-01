/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
// plane imports
import type { IFavorite, TLogoProps } from "@plane/types";
// components
// plane web constants
import { FAVORITE_ITEM_ICONS, FAVORITE_ITEM_LINKS } from "@/constants/sidebar-favorites";

export const getFavoriteItemIcon = (type: string, logo?: TLogoProps) => {
  const Icon = FAVORITE_ITEM_ICONS[type] || PageIcon;

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
    return `/${workspaceSlug}/`;
  }

  if (entityLinkDetails.itemLevel === "workspace") {
    return `/${workspaceSlug}/${entityLinkDetails.getLink(favorite)}/`;
  } else if (entityLinkDetails.itemLevel === "project") {
    return `/${workspaceSlug}/projects/${favorite.project_id}/${entityLinkDetails.getLink(favorite)}/`;
  } else {
    return `/${workspaceSlug}/`;
  }
};
