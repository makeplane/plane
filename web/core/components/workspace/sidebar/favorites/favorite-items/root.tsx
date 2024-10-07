"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/helpers";
// ui
import { IFavorite } from "@plane/types";
// components
import {
  FavoriteItemDragHandle,
  FavoriteItemQuickAction,
  FavoriteItemWrapper,
  FavoriteItemTitle,
} from "@/components/workspace/sidebar/favorites";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useFavoriteItemDetails } from "@/hooks/use-favorite-item-details";

type Props = {
  workspaceSlug: string;
  favorite: IFavorite;
  favoriteMap: Record<string, IFavorite>;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleRemoveFromFavoritesFolder: (favoriteId: string) => void;
};

export const FavoriteRoot: FC<Props> = observer((props) => {
  // props
  const { workspaceSlug, favorite, favoriteMap, handleRemoveFromFavorites, handleRemoveFromFavoritesFolder } = props;
  // store hooks
  const { sidebarCollapsed } = useAppTheme();

  //state
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  //ref
  const elementRef = useRef<HTMLDivElement>(null);
  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  const handleQuickAction = (value: boolean) => setIsMenuActive(value);

  const { itemLink, itemIcon, itemTitle } = useFavoriteItemDetails(workspaceSlug, favorite);

  // drag and drop
  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        dragHandle: elementRef.current,
        canDrag: () => true,
        getInitialData: () => ({ id: favorite.id, type: "CHILD" }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      }),
      dropTargetForElements({
        element,
        onDragStart: () => {
          setIsDragging(true);
        },
        onDragEnter: () => {
          setIsDragging(true);
        },
        onDragLeave: () => {
          setIsDragging(false);
        },
        onDrop: ({ source }) => {
          setIsDragging(false);
          const sourceId = source?.data?.id as string | undefined;
          if (!sourceId || !favoriteMap[sourceId].parent) return;
          handleRemoveFromFavoritesFolder(sourceId);
        },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef?.current, isDragging]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <>
      <FavoriteItemWrapper elementRef={elementRef} isMenuActive={isMenuActive} sidebarCollapsed={sidebarCollapsed}>
        {!sidebarCollapsed && <FavoriteItemDragHandle isDragging={isDragging} sort_order={favorite.sort_order} />}
        <FavoriteItemTitle
          href={itemLink}
          projectId={favorite.project_id}
          icon={itemIcon}
          title={itemTitle}
          isSidebarCollapsed={!!sidebarCollapsed}
        />
        {!sidebarCollapsed && (
          <FavoriteItemQuickAction
            favorite={favorite}
            ref={actionSectionRef}
            isMenuActive={isMenuActive}
            onChange={handleQuickAction}
            handleRemoveFromFavorites={handleRemoveFromFavorites}
          />
        )}
      </FavoriteItemWrapper>
    </>
  );
});
