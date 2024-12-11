"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DropTargetRecord, DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import {
  draggable,
  dropTargetForElements,
  ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";

import { observer } from "mobx-react";
// plane helpers
import { createRoot } from "react-dom/client";
import { useOutsideClickDetector } from "@plane/hooks";
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
import { getCanDrop, getInstructionFromPayload } from "../favorites.helpers";

type Props = {
  isLastChild: boolean;
  parentId: string | undefined;
  workspaceSlug: string;
  favorite: IFavorite;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleDrop: (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => void;
};

export const FavoriteRoot: FC<Props> = observer((props) => {
  // props
  const { isLastChild, parentId, workspaceSlug, favorite, handleRemoveFromFavorites, handleDrop } = props;
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
        getData: ({ input, element }) => {
          const blockedStates: InstructionType[] = ["make-child"];
          if (!isLastChild) {
            blockedStates.push("reorder-below");
          }

          return attachInstruction(initialData, {
            input,
            element,
            currentLevel: 1,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
            block: blockedStates,
          });
        },
        onDrag: ({ self, source, location }) => {
          const instruction = getInstructionFromPayload(self, source, location);
          setInstruction(instruction);
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({ self, source, location }) => {
          setInstruction(undefined);
          handleDrop(self, source, location);
        },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef?.current, isDragging]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return (
    <>
      <DropIndicator isVisible={instruction === "reorder-above"} />
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
      {isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
    </>
  );
});
