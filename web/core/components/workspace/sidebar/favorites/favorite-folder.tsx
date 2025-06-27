"use client";

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  DragLocationHistory,
  ElementDragPayload,
  DropTargetRecord,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";

import orderBy from "lodash/orderBy";
import { useParams } from "next/navigation";
import { createRoot } from "react-dom/client";
import { PenSquare, Star, MoreHorizontal, ChevronRight, GripVertical } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { IFavorite, InstructionType } from "@plane/types";
import { CustomMenu, Tooltip, DropIndicator, FavoriteFolderIcon, DragHandle } from "@plane/ui";
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

export const FavoriteFolder: React.FC<Props> = (props) => {
  const { favorite, handleRemoveFromFavorites, isLastChild, handleDrop } = props;
  // store hooks
  const { getGroupedFavorites } = useFavorite();
  const { isMobile } = usePlatformOS();
  const { workspaceSlug } = useParams();
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
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
      getGroupedFavorites(workspaceSlug.toString(), favorite.id);
    }
  }, [favorite.id, favorite.children, workspaceSlug, getGroupedFavorites]);

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
                <div className="rounded flex gap-1 bg-custom-background-100 text-sm p-1 pr-2">
                  <div className="size-5 grid place-items-center flex-shrink-0">
                    <FavoriteFolderIcon />
                  </div>
                  <p className="truncate text-sm font-medium text-custom-sidebar-text-200">{favorite.name}</p>
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
      <Disclosure key={`${favorite.id}`} ref={elementRef} defaultOpen={false}>
        {({ open }) => (
          <div
            // id={`sidebar-${projectId}-${projectListType}`}
            className={cn("relative", {
              "bg-custom-sidebar-background-80 opacity-60": isDragging,
              "border-[2px] border-custom-primary-100": instruction === "make-child",
            })}
          >
            {/* draggable drop top indicator */}
            <DropIndicator isVisible={instruction === "reorder-above"} />
            <div
              className={cn(
                "group/project-item relative w-full px-2 py-1.5 flex items-center rounded-md text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-90",
                {
                  "bg-custom-sidebar-background-90": isMenuActive,
                }
              )}
            >
              {/* draggable indicator */}

              <div className="flex-shrink-0 w-3 h-3 rounded-sm absolute left-0 hidden group-hover:flex justify-center items-center transition-colors bg-custom-background-90 cursor-pointer text-custom-text-200 hover:text-custom-text-100">
                <GripVertical className="w-3 h-3" />
              </div>

              <>
                <Tooltip tooltipContent={`${favorite.name}`} position="right" className="ml-8" isMobile={isMobile}>
                  <div className="flex-grow flex truncate">
                    <Disclosure.Button
                      as="button"
                      type="button"
                      className="flex-grow flex items-center gap-1.5 text-left select-none w-full"
                    >
                      <Tooltip
                        isMobile={isMobile}
                        tooltipContent={
                          favorite.sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"
                        }
                        position="top-right"
                        disabled={isDragging}
                      >
                        <button
                          type="button"
                          className={cn(
                            "hidden group-hover/project-item:flex items-center justify-center absolute top-1/2 -left-3 -translate-y-1/2 rounded text-custom-sidebar-text-400 cursor-grab",
                            {
                              "cursor-not-allowed opacity-60": favorite.sort_order === null,
                              "cursor-grabbing": isDragging,
                            }
                          )}
                        >
                          <DragHandle className="bg-transparent" />
                        </button>
                      </Tooltip>
                      <div className="size-5 grid place-items-center flex-shrink-0">
                        <FavoriteFolderIcon />
                      </div>
                      <p className="truncate text-sm font-medium text-custom-sidebar-text-200">{favorite.name}</p>
                    </Disclosure.Button>
                  </div>
                </Tooltip>
                <CustomMenu
                  customButton={
                    <span
                      ref={actionSectionRef}
                      className="grid place-items-center p-0.5 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 rounded"
                    >
                      <MoreHorizontal className="size-3" />
                    </span>
                  }
                  menuButtonOnClick={() => setIsMenuActive(!isMenuActive)}
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
                      <Star className="h-3.5 w-3.5 fill-yellow-500 stroke-yellow-500" />
                      <span>Remove from favorites</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={() => setFolderToRename(favorite.id)}>
                    <div className="flex items-center justify-start gap-2">
                      <PenSquare className="h-3.5 w-3.5 stroke-[1.5] text-custom-text-300" />
                      <span>Rename Folder</span>
                    </div>
                  </CustomMenu.MenuItem>
                </CustomMenu>
                <Disclosure.Button
                  as="button"
                  type="button"
                  className={cn(
                    "hidden group-hover/project-item:inline-block p-0.5 rounded hover:bg-custom-sidebar-background-80",
                    {
                      "inline-block": isMenuActive,
                    }
                  )}
                  aria-label={t(
                    open ? "aria_labels.projects_sidebar.close_folder" : "aria_labels.projects_sidebar.open_folder"
                  )}
                >
                  <ChevronRight
                    className={cn("size-3 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
                      "rotate-90": open,
                    })}
                  />
                </Disclosure.Button>
              </>
            </div>
            {favorite.children && favorite.children.length > 0 && (
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel as="div" className="flex flex-col gap-0.5 mt-1 px-2">
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
                </Disclosure.Panel>
              </Transition>
            )}
            {/* draggable drop bottom indicator */}
            {isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
          </div>
        )}
      </Disclosure>
    </>
  );
};
