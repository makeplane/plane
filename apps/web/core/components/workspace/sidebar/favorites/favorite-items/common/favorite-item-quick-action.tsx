import React from "react";
import { observer } from "mobx-react";
import { MoreHorizontal, Star } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IFavorite } from "@plane/types";
import { CustomMenu } from "@plane/ui";
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
    <CustomMenu
      customButton={
        <span ref={ref} className="grid place-items-center p-0.5 text-placeholder hover:bg-layer-1 rounded-sm">
          <MoreHorizontal className="size-4" />
        </span>
      }
      menuButtonOnClick={() => onChange(!isMenuActive)}
      className={cn(
        "opacity-0 pointer-events-none flex-shrink-0 group-hover/project-item:opacity-100 group-hover/project-item:pointer-events-auto",
        {
          "opacity-100 pointer-events-auto": isMenuActive,
        }
      )}
      customButtonClassName="grid place-items-center"
      placement="bottom-start"
      ariaLabel={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
    >
      <CustomMenu.MenuItem onClick={() => handleRemoveFromFavorites(favorite)}>
        <span className="flex items-center justify-start gap-2">
          <Star className="h-3.5 w-3.5 fill-yellow-500 stroke-yellow-500 flex-shrink-0" />
          <span>Remove from favorites</span>
        </span>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
});
