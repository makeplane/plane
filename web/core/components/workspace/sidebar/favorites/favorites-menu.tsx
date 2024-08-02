"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { FavoriteItem } from "./favorite-item";
import { NewFavoriteFolder } from "./new-fav-folder";
export const SidebarFavoritesMenu = observer(() => {
  //state
  const [createNewFolder, setCreateNewFolder] = useState<boolean | string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false); // scroll animation state

  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { favoriteIds, favoriteMap, deleteFavorite } = useFavorite();
  const { workspaceSlug } = useParams();

  const { isMobile } = usePlatformOS();

  // local storage
  const { setValue: toggleFavoriteMenu, storedValue } = useLocalStorage<boolean>("is_favorite_menu_open", false);
  // derived values
  const isFavoriteMenuOpen = !!storedValue;
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);

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
  useEffect(() => {
    if (sidebarCollapsed) toggleFavoriteMenu(true);
  }, [sidebarCollapsed, toggleFavoriteMenu]);

  /**
   * Implementing scroll animation styles based on the scroll length of the container
   */
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsScrolled(scrollTop > 0);
      }
    };
    const currentContainerRef = containerRef.current;
    if (currentContainerRef) {
      currentContainerRef.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (currentContainerRef) {
        currentContainerRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [containerRef]);
  return (
    <div
      ref={containerRef}
      className={cn("-mr-3 -ml-4 pl-4", {
        "border-t border-custom-sidebar-border-300": isScrolled,
        "vertical-scrollbar h-full !overflow-y-scroll scrollbar-sm": isFavoriteMenuOpen,
      })}
    >
      <Disclosure as="div" defaultOpen>
        {!sidebarCollapsed && (
          <Disclosure.Button
            as="button"
            className="group/workspace-button w-full px-2 py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90 rounded text-xs font-semibold"
          >
            <span onClick={() => toggleFavoriteMenu(!isFavoriteMenuOpen)} className="flex-1 text-start">
              MY FAVORITES
            </span>
            <span className="flex gap-2 flex-shrink-0 opacity-0 pointer-events-none group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto rounded p-0.5 ">
              <FolderPlus
                onClick={() => {
                  setCreateNewFolder(true);
                  !isFavoriteMenuOpen && toggleFavoriteMenu(!isFavoriteMenuOpen);
                }}
                className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform")}
              />
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
              {favoriteIds
                .filter((id) => !favoriteMap[id].parent)
                .map((id, index) => (
                  <Tooltip
                    key={favoriteMap[id].id}
                    tooltipContent={
                      favoriteMap[id].entity_data ? favoriteMap[id].entity_data.name : favoriteMap[id].name
                    }
                    position="right"
                    className="ml-2"
                    disabled={!sidebarCollapsed}
                    isMobile={isMobile}
                  >
                    {favoriteMap[id].is_folder ? (
                      <FavoriteFolder
                        favorite={favoriteMap[id]}
                        isLastChild={index === favoriteIds.length - 1}
                        handleRemoveFromFavorites={handleRemoveFromFavorites}
                      />
                    ) : (
                      <FavoriteItem favorite={favoriteMap[id]} handleRemoveFromFavorites={handleRemoveFromFavorites} />
                    )}
                  </Tooltip>
                ))}
            </Disclosure.Panel>
          )}
        </Transition>
      </Disclosure>
    </div>
  );
});
