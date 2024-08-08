"use client";
import React, { FC } from "react";
import { MoreHorizontal, Star } from "lucide-react";
import { IFavorite } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  ref: React.MutableRefObject<HTMLDivElement | null>;
  isMenuActive: boolean;
  favorite: IFavorite;
  onChange: (value: boolean) => void;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
};

export const FavoriteItemQuickAction: FC<Props> = (props) => {
  const { ref, isMenuActive, onChange, handleRemoveFromFavorites, favorite } = props;
  return (
    <CustomMenu
      customButton={
        <span
          ref={ref}
          className="grid place-items-center p-0.5 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 rounded"
          onClick={() => onChange(!isMenuActive)}
        >
          <MoreHorizontal className="size-4" />
        </span>
      }
      className={cn(
        "opacity-0 pointer-events-none flex-shrink-0 group-hover/project-item:opacity-100 group-hover/project-item:pointer-events-auto",
        {
          "opacity-100 pointer-events-auto": isMenuActive,
        }
      )}
      customButtonClassName="grid place-items-center"
      placement="bottom-start"
    >
      <CustomMenu.MenuItem onClick={() => handleRemoveFromFavorites(favorite)}>
        <span className="flex items-center justify-start gap-2">
          <Star className="h-3.5 w-3.5 fill-yellow-500 stroke-yellow-500 flex-shrink-0" />
          <span>Remove from favorites</span>
        </span>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
};
