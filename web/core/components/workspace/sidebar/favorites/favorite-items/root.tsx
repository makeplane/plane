"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
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

import { createRoot } from "react-dom/client";
import { DropIndicator } from "@plane/ui";
//constants
import { getDestinationStateSequence } from "../favorites.helpers";

type Props = {
  workspaceSlug: string;
  favorite: IFavorite;
  favoriteMap: Record<string, IFavorite>;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleRemoveFromFavoritesFolder: (favoriteId: string) => void;
  handleReorder: (favoriteId: string, sequence: number) => void;
};

export const FavoriteRoot: FC<Props> = observer((props) => {
  // props
  const {
    workspaceSlug,
    favorite,
    favoriteMap,
    handleRemoveFromFavorites,
    handleRemoveFromFavoritesFolder,
    handleReorder,
  } = props;
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { itemLink, itemIcon, itemTitle } = useFavoriteItemDetails(workspaceSlug, favorite);
  //state
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [closestEdge, setClosestEdge] = useState<string | null>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  //ref
  const elementRef = useRef<HTMLDivElement>(null);
  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  const handleQuickAction = (value: boolean) => setIsMenuActive(value);


  // drag and drop
  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;
    const initialData = { id: favorite.id, type: favorite.parent ? 'CHILD' : 'NON_PARENT' };

    return combine(
      draggable({
        element,
        dragHandle: elementRef.current,
        getInitialData: () => initialData,
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: (data) => {
          setIsDraggedOver(false);
          setIsDragging(false);
          if (!data.location.current.dropTargets[0]) return;
          const destinationData = data.location.current.dropTargets[0].data;

          if (favorite.id && destinationData) {
            const edge = extractClosestEdge(destinationData) || undefined;
            const sequence = Math.round(
              getDestinationStateSequence(favoriteMap, destinationData.id as string, edge) || 0
            );
            handleReorder(favorite.id, sequence);
          }
        },
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "0px", y: "0px" }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(
                <div className="rounded bg-custom-background-100 text-sm p-1 pr-2">
                  <FavoriteItemTitle
                    href={itemLink}
                    icon={itemIcon}
                    title={itemTitle}
                    isSidebarCollapsed={!!sidebarCollapsed}
                  />
                </div>
              );
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
      }),
      dropTargetForElements({
        element,
        onDragStart: () => {
          setIsDragging(true);
        },
        getData: ({ input, element }) =>
          attachClosestEdge(initialData, {
            input,
            element,
            allowedEdges: ["top", "bottom"],
          }),
        onDragEnter: (args) => {
          setIsDragging(true);
          setIsDraggedOver(true);
          setClosestEdge(extractClosestEdge(args.self.data));
        },
        onDragLeave: () => {
          setIsDragging(false);
          setIsDraggedOver(false);
          setClosestEdge(null);
        },
        onDrop: ({ self, source }) => {
          setIsDragging(false);
          setIsDraggedOver(false);
          const sourceId = source.data?.id as string | undefined;
          const destinationType = self.data?.type as string | undefined;
          const sourceType = source.data?.type as string | undefined;
          
          if(!sourceId) return;

          if(destinationType === 'NON_PARENT'){
            handleRemoveFromFavoritesFolder(sourceId)
          } 
        },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef?.current, isDragging]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <>
      <FavoriteItemWrapper elementRef={elementRef} isMenuActive={isMenuActive} sidebarCollapsed={sidebarCollapsed}>
        <DropIndicator isVisible={isDraggedOver && closestEdge === "top"} classNames="absolute top-0" />
        {!sidebarCollapsed && <FavoriteItemDragHandle isDragging={isDragging} sort_order={favorite.sort_order} />}
        <FavoriteItemTitle href={itemLink} icon={itemIcon} title={itemTitle} isSidebarCollapsed={!!sidebarCollapsed} />
        {!sidebarCollapsed && (
          <FavoriteItemQuickAction
            favorite={favorite}
            ref={actionSectionRef}
            isMenuActive={isMenuActive}
            onChange={handleQuickAction}
            handleRemoveFromFavorites={handleRemoveFromFavorites}
          />
        )}
        <DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} classNames="absolute bottom-0" />
      </FavoriteItemWrapper>
    </>
  );
});
