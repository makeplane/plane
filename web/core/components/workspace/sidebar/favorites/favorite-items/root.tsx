"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";

import { observer } from "mobx-react";
// plane helpers
import { createRoot } from "react-dom/client";
import { useOutsideClickDetector } from "@plane/helpers";
// ui
import { IFavorite, InstructionType } from "@plane/types";
// components
import { DropIndicator } from "@plane/ui";
import {
  FavoriteItemDragHandle,
  FavoriteItemQuickAction,
  FavoriteItemWrapper,
  FavoriteItemTitle,
} from "@/components/workspace/sidebar/favorites";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useFavoriteItemDetails } from "@/hooks/use-favorite-item-details";
//helpers
import { getCanDrop, TargetData , getInstructionFromPayload, getDestinationStateSequence} from "../favorites.helpers";


type Props = {
  isLastChild: boolean;
  parentId: string | undefined;
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
    isLastChild,
    parentId,
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
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);

  //ref
  const elementRef = useRef<HTMLDivElement>(null);
  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  const handleQuickAction = (value: boolean) => setIsMenuActive(value);


  // drag and drop
  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;
    const initialData = { id: favorite.id, isGroup: false, isChild: !!parentId, parentId };
    return combine(
      draggable({
        element,
        dragHandle: elementRef.current,
        getInitialData: () => initialData,
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
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
        canDrop: ({ source }) => getCanDrop(source, favorite, !!parentId),
        onDragStart: () => {
          setIsDragging(true);
        },
        getData: ({ input, element }) =>{

          const blockedStates: InstructionType[] = ['make-child'];
          if(!isLastChild){
            blockedStates.push('reorder-below');
          }

          return attachInstruction(initialData,{
            input,
            element,
            currentLevel: 1,
            indentPerLevel: 0,
            mode: isLastChild ? 'last-in-group' : 'standard',
            block: blockedStates
          })
        },
        onDrag: ({ self, source, location }) => {
          const instruction = getInstructionFromPayload(self, source, location);
          setInstruction(instruction);
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({  source, location }) => {
          setInstruction(undefined);
          const dropTargets = location?.current?.dropTargets ?? []
          if(!dropTargets || dropTargets.length <= 0) return;

          const dropTarget = dropTargets.length > 1 ? dropTargets.find(target=>target?.data?.isChild) : dropTargets[0];

          const dropTargetData = dropTarget?.data as TargetData;

          if(!dropTarget || !dropTargetData) return;

          const instruction = getInstructionFromPayload(dropTarget, source, location);
          const parentId = instruction === 'make-child' ? dropTargetData.id : dropTargetData.parentId;
          const droppedFavId = instruction !== "make-child" ? dropTargetData.id : undefined;
          const sourceData = source.data as TargetData;

          if(droppedFavId && sourceData.id){
            const destinationSequence = getDestinationStateSequence(favoriteMap,droppedFavId,instruction)
            handleReorder(sourceData.id,destinationSequence || 0)
          }

          if(!parentId && sourceData.isChild){
            handleRemoveFromFavoritesFolder(sourceData.id)
          }
        },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef?.current, isDragging]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <>
      <DropIndicator isVisible={instruction === "reorder-above"}/>
      <FavoriteItemWrapper elementRef={elementRef} isMenuActive={isMenuActive} sidebarCollapsed={sidebarCollapsed}>
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
      </FavoriteItemWrapper>
      { isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
    </>
  );
});
