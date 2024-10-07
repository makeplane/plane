"use client";

import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import orderBy from "lodash/orderBy";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight, FolderPlus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { IFavorite } from "@plane/types";
import { setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// constants

// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useFavorite } from "@/hooks/store/use-favorite";
import useLocalStorage from "@/hooks/use-local-storage";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { FavoriteFolder } from "./favorite-folder";
import { FavoriteRoot } from "./favorite-items";
import { NewFavoriteFolder } from "./new-fav-folder";

export const SidebarFavoritesMenu = observer(() => {
  //state
  const [createNewFolder, setCreateNewFolder] = useState<boolean | string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { favoriteIds, groupedFavorites, deleteFavorite, removeFromFavoriteFolder } = useFavorite();
  const { workspaceSlug } = useParams();

  const { isMobile } = usePlatformOS();

  // local storage
  const { setValue: toggleFavoriteMenu, storedValue } = useLocalStorage<boolean>("is_favorite_menu_open", false);
  // derived values
  const isFavoriteMenuOpen = !!storedValue;
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef(null);

  const handleRemoveFromFavorites = (favorite: IFavorite) => {
    deleteFavorite(workspaceSlug.toString(), favorite.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Favorite removed successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong!",
        });
      });
  };
  const handleRemoveFromFavoritesFolder = (favoriteId: string) => {
    removeFromFavoriteFolder(workspaceSlug.toString(), favoriteId, {
      id: favoriteId,
      parent: null,
    })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Favorite moved successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to move favorite.",
        });
      });
  };
  useEffect(() => {
    if (sidebarCollapsed) toggleFavoriteMenu(true);
  }, [sidebarCollapsed, toggleFavoriteMenu]);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        onDragEnter: () => {
          setIsDragging(true);
        },
        onDragLeave: () => {
          setIsDragging(false);
        },
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: ({ source }) => {
          setIsDragging(false);
          const sourceId = source?.data?.id as string | undefined;
          console.log({ sourceId });
          if (!sourceId || !groupedFavorites[sourceId].parent) return;
          handleRemoveFromFavoritesFolder(sourceId);
        },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef.current, isDragging]);

  return (
    <>
      <Disclosure as="div" defaultOpen ref={containerRef}>
        {!sidebarCollapsed && (
          <Disclosure.Button
            ref={elementRef}
            as="button"
            className={cn(
              "sticky top-0 bg-custom-sidebar-background-100 z-10 group/workspace-button w-full px-2 py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90 rounded text-xs font-semibold",
              {
                "bg-custom-sidebar-background-80 opacity-60": isDragging,
              }
            )}
          >
            <span onClick={() => toggleFavoriteMenu(!isFavoriteMenuOpen)} className="flex-1 text-start">
              YOUR FAVORITES
            </span>
            <span className="flex flex-shrink-0 opacity-0 pointer-events-none group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto rounded p-0.5 ">
              <Tooltip tooltipHeading="Create folder" tooltipContent="">
                <FolderPlus
                  onClick={() => {
                    setCreateNewFolder(true);
                    !isFavoriteMenuOpen && toggleFavoriteMenu(!isFavoriteMenuOpen);
                  }}
                  className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform")}
                />
              </Tooltip>
              <ChevronRight
                onClick={() => toggleFavoriteMenu(!isFavoriteMenuOpen)}
                className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
                  "rotate-90": isFavoriteMenuOpen,
                })}
              />
            </span>
          </Disclosure.Button>
        )}
        <Transition
          show={isFavoriteMenuOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          {isFavoriteMenuOpen && (
            <Disclosure.Panel
              as="div"
              className={cn("flex flex-col mt-0.5 gap-0.5", {
                "space-y-0 mt-0 ml-0": sidebarCollapsed,
              })}
              static
            >
              {createNewFolder && <NewFavoriteFolder setCreateNewFolder={setCreateNewFolder} actionType="create" />}
              {Object.keys(groupedFavorites).length === 0 ? (
                <>
                  {!sidebarCollapsed && (
                    <span className="text-custom-text-400 text-xs font-medium px-8 py-1.5">No favorites yet</span>
                  )}
                </>
              ) : (
                orderBy(Object.values(groupedFavorites), "sequence", "desc")
                  .filter((fav) => !fav.parent)
                  .map((fav, index) => (
                    <Tooltip
                      key={fav.id}
                      tooltipContent={fav?.entity_data ? fav.entity_data?.name : fav?.name}
                      position="right"
                      className="ml-2"
                      disabled={!sidebarCollapsed}
                      isMobile={isMobile}
                    >
                      {fav.is_folder ? (
                        <FavoriteFolder
                          favorite={fav}
                          isLastChild={index === favoriteIds.length - 1}
                          handleRemoveFromFavorites={handleRemoveFromFavorites}
                          handleRemoveFromFavoritesFolder={handleRemoveFromFavoritesFolder}
                        />
                      ) : (
                        <FavoriteRoot
                          workspaceSlug={workspaceSlug.toString()}
                          favorite={fav}
                          handleRemoveFromFavorites={handleRemoveFromFavorites}
                          handleRemoveFromFavoritesFolder={handleRemoveFromFavoritesFolder}
                          favoriteMap={groupedFavorites}
                        />
                      )}
                    </Tooltip>
                  ))
              )}
            </Disclosure.Panel>
          )}
        </Transition>
      </Disclosure>

      <hr
        className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-1", {
          "opacity-0": !sidebarCollapsed || favoriteIds.length === 0,
        })}
      />
    </>
  );
});
