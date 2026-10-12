/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { MoreHorizontalOutline, StarFilled } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IFavorite } from "@plane/types";
// helpers
import { cn } from "@plane/utils";

type Props = {
  ref: React.MutableRefObject<HTMLDivElement | null>;
  isMenuActive: boolean;
  favorite: IFavorite;
  onChange: (value: boolean) => void;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
};

export const FavoriteItemQuickAction = observer(function FavoriteItemQuickAction(props: Props) {
  const { ref, isMenuActive, onChange, handleRemoveFromFavorites, favorite } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none flex-shrink-0 opacity-0 group-hover/project-item:pointer-events-auto group-hover/project-item:opacity-100",
        {
          "pointer-events-auto opacity-100": isMenuActive,
        }
      )}
    >
      <Menu onOpenChange={onChange}>
        <MenuTrigger
          render={
            <button
              type="button"
              className="grid place-items-center rounded-sm p-0.5 text-placeholder hover:bg-layer-1"
              aria-label={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
            >
              <MoreHorizontalOutline className="size-4" />
            </button>
          }
        />
        <MenuContent side="bottom" align="start">
          <MenuItem
            icon={<Icon icon={<StarFilled className="text-yellow-500" />} />}
            label={t("remove_from_favorites")}
            onClick={() => handleRemoveFromFavorites(favorite)}
          />
        </MenuContent>
      </Menu>
    </div>
  );
});
