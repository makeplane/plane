/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import type {
  DragLocationHistory,
  ElementDragPayload,
  DropTargetRecord,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";

import { orderBy } from "lodash-es";
import { useParams } from "next/navigation";
import { createRoot } from "react-dom/client";
import {
  ChevronRightOutline,
  DraftsOutline,
  DragDropOutline,
  MoreHorizontalOutline,
  StarFilled,
} from "@makeplane/propel/icons";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { FavoriteFolderIcon } from "@plane/blocks/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IFavorite, InstructionType } from "@plane/types";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { DropIndicator, DragHandle } from "@plane/blocks/common";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useFavorite } from "@/hooks/store/use-favorite";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { FavoriteRoot } from "./favorite-items";
import { getCanDrop, getInstructionFromPayload } from "./favorites.helpers";
import { NewFavoriteFolder } from "./new-fav-folder";

type Props = {
  isLastChild: boolean;
  favorite: IFavorite;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
  handleRemoveFromFavoritesFolder: (favoriteId: string) => void;
  handleDrop: (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => void;
};

export function FavoriteFolder(props: Props) {
  const { favorite, handleRemoveFromFavorites, isLastChild, handleDrop } = props;
  // store hooks
  const { fetchGroupedFavorites } = useFavorite();
  const { isMobile } = usePlatformOS();
  const { workspaceSlug } = useParams();
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [folderToRename, setFolderToRename] = useState<string | boolean | null>(null);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  // translation
  const { t } = useTranslation();

  useEffect(() => {
    if (favorite.children === undefined && workspaceSlug) {
      fetchGroupedFavorites(workspaceSlug.toString(), favorite.id);
    }
  }, [favorite.id, favorite.children, workspaceSlug, fetchGroupedFavorites]);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;
    const initialData = { id: favorite.id, isGroup: true, isChild: false };

    return combine(
      draggable({
        element,
        getInitialData: () => initialData,
        onDragStart: () => setIsDragging(true),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "0px", y: "0px" }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(
                <div className="flex gap-1 rounded-sm bg-surface-1 p-1 pr-2 text-13">
                  <div className="grid size-5 flex-shrink-0 place-items-center">
                    <FavoriteFolderIcon />
                  </div>
                  <p className="truncate text-13 font-medium text-secondary">{favorite.name}</p>
                </div>
              );
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
        onDrop: () => {
          setIsDragging(false);
        }, // canDrag: () => isDraggable,
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => getCanDrop(source, favorite, false),
        getData: ({ input, element }) => {
          const blockedStates: InstructionType[] = [];
          if (!isLastChild) {
            blockedStates.push("reorder-below");
          }

          return attachInstruction(initialData, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
            block: blockedStates,
          });
        },
        onDrag: ({ source, self, location }) => {
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
  }, [isDragging, favorite.id, isLastChild, favorite.id]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  return folderToRename ? (
    <NewFavoriteFolder
      setCreateNewFolder={setFolderToRename}
      actionType="rename"
      defaultName={favorite.name}
      favoriteId={favorite.id}
    />
  ) : (
    <>
      <div
        key={`${favorite.id}`}
        ref={elementRef}
        // id={`sidebar-${projectId}-${projectListType}`}
        className={cn("relative", {
          "bg-layer-1 opacity-60": isDragging,
          "border-[2px] border-accent-strong": instruction === "make-child",
        })}
      >
        {/* draggable drop top indicator */}
        <DropIndicator isVisible={instruction === "reorder-above"} />
        <div
          className={cn(
            "group/project-item relative flex w-full items-center rounded-md px-2 py-1.5 text-primary hover:bg-layer-1-hover",
            {
              "bg-surface-2": isMenuActive,
            }
          )}
        >
          {/* draggable indicator */}

          <div className="absolute left-0 hidden h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center rounded-xs bg-surface-2 text-secondary transition-colors group-hover:flex hover:text-primary">
            <DragDropOutline className="h-3 w-3" />
          </div>

          <>
            <Tooltip label={`${favorite.name}`} layout="stacked" side="right" sideOffset={40} disabled={isMobile}>
              <div className="flex flex-grow truncate">
                <button
                  type="button"
                  className="flex w-full flex-grow items-center gap-1.5 text-left select-none"
                  aria-expanded={isOpen}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <Tooltip
                    label={favorite.sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"}
                    align="end"
                    disabled={isDragging || isMobile}
                  >
                    <button
                      type="button"
                      className={cn(
                        "absolute top-1/2 -left-3 hidden -translate-y-1/2 cursor-grab items-center justify-center rounded-sm text-placeholder group-hover/project-item:flex",
                        {
                          "cursor-not-allowed opacity-60": favorite.sort_order === null,
                          "cursor-grabbing": isDragging,
                        }
                      )}
                    >
                      <DragHandle className="bg-transparent" />
                    </button>
                  </Tooltip>
                  <div className="grid size-5 flex-shrink-0 place-items-center">
                    <FavoriteFolderIcon />
                  </div>
                  <p className="truncate text-13 font-medium text-secondary">{favorite.name}</p>
                </button>
              </div>
            </Tooltip>
            <div
              ref={actionSectionRef}
              className={cn(
                "pointer-events-none flex-shrink-0 opacity-0 group-hover/project-item:pointer-events-auto group-hover/project-item:opacity-100",
                {
                  "pointer-events-auto opacity-100": isMenuActive,
                }
              )}
            >
              <Menu onOpenChange={setIsMenuActive}>
                <MenuTrigger
                  render={
                    <button
                      type="button"
                      className="grid place-items-center rounded-sm p-0.5 text-placeholder hover:bg-layer-1"
                      aria-label={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
                    >
                      <MoreHorizontalOutline className="size-3" />
                    </button>
                  }
                />
                <MenuContent side="bottom" align="start">
                  <MenuItem
                    icon={<Icon icon={<StarFilled className="text-yellow-500" />} />}
                    label={t("remove_from_favorites")}
                    onClick={() => handleRemoveFromFavorites(favorite)}
                  />
                  <MenuItem
                    icon={<Icon icon={DraftsOutline} tint="tertiary" />}
                    label="Rename Folder"
                    onClick={() => setFolderToRename(favorite.id)}
                  />
                </MenuContent>
              </Menu>
            </div>
            <button
              type="button"
              className={cn("hidden rounded-sm p-0.5 group-hover/project-item:inline-block hover:bg-layer-1", {
                "inline-block": isMenuActive,
              })}
              aria-expanded={isOpen}
              aria-label={t(
                isOpen ? "aria_labels.projects_sidebar.close_folder" : "aria_labels.projects_sidebar.open_folder"
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronRightOutline
                className={cn("size-3 flex-shrink-0 text-placeholder transition-transform", {
                  "rotate-90": isOpen,
                })}
              />
            </button>
          </>
        </div>
        {/* Headless UI `Transition` replaced by the propel `fade-in` keyframe (Ruling 36); the
                close direction unmounts immediately, as there is no exit animation to hang off. */}
        {isOpen && favorite.children && favorite.children.length > 0 && (
          <div className="animate-fade-in">
            <div className="mt-1 flex flex-col gap-0.5 px-2">
              {orderBy(favorite.children, "sequence", "desc").map((child, index) => (
                <FavoriteRoot
                  key={child.id}
                  workspaceSlug={workspaceSlug.toString()}
                  favorite={child}
                  isLastChild={index === favorite.children.length - 1}
                  parentId={favorite.id}
                  handleRemoveFromFavorites={handleRemoveFromFavorites}
                  handleDrop={handleDrop}
                />
              ))}
            </div>
          </div>
        )}
        {/* draggable drop bottom indicator */}
        {isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
      </div>
    </>
  );
}
