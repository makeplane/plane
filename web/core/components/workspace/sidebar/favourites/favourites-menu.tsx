"use client";

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight, FolderPlus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { IFavourite } from "@plane/types";
import { setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// constants

// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useFavourite } from "@/hooks/store/use-favourite";
import useLocalStorage from "@/hooks/use-local-storage";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { FavouriteFolder } from "./favourite-folder";
import { FavouriteItem } from "./favourite-item";
import { NewFavouriteFolder } from "./new-fav-folder";
export const SidebarFavouritesMenu = observer(() => {
  //state
  const [createNewFolder, setCreateNewFolder] = useState<boolean | string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false); // scroll animation state

  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { favouriteIds, favouriteMap, deleteFavourite } = useFavourite();
  const { workspaceSlug } = useParams();

  const { isMobile } = usePlatformOS();

  // local storage
  const { setValue: toggleFavouriteMenu, storedValue } = useLocalStorage<boolean>("is_favourite_menu_open", false);
  // derived values
  const isFavouriteMenuOpen = !!storedValue;
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleRemoveFromFavorites = (favourite: IFavourite) => {
    deleteFavourite(workspaceSlug.toString(), favourite.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Favourite removed successfully.",
        });
      })
      .catch((err) => {
        Object.keys(err.data).map((key) => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: err.data[key],
          });
        });
      });
  };
  useEffect(() => {
    if (sidebarCollapsed) toggleFavouriteMenu(true);
  }, [sidebarCollapsed, toggleFavouriteMenu]);

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
        "vertical-scrollbar h-full !overflow-y-scroll scrollbar-sm": isFavouriteMenuOpen,
      })}
    >
      <Disclosure as="div" defaultOpen>
        {!sidebarCollapsed && (
          <Disclosure.Button
            as="button"
            className="group/workspace-button w-full px-2 py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90 rounded text-xs font-semibold"
          >
            <span onClick={() => toggleFavouriteMenu(!isFavouriteMenuOpen)} className="flex-1 text-start">
              MY FAVOURITES
            </span>
            <span className="flex gap-2 flex-shrink-0 opacity-0 pointer-events-none group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto rounded p-0.5 ">
              <FolderPlus
                onClick={() => {
                  setCreateNewFolder(true);
                  !isFavouriteMenuOpen && toggleFavouriteMenu(!isFavouriteMenuOpen);
                }}
                className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform")}
              />
              <ChevronRight
                onClick={() => toggleFavouriteMenu(!isFavouriteMenuOpen)}
                className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
                  "rotate-90": isFavouriteMenuOpen,
                })}
              />
            </span>
          </Disclosure.Button>
        )}
        <Transition
          show={isFavouriteMenuOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          {isFavouriteMenuOpen && (
            <Disclosure.Panel
              as="div"
              className={cn("flex flex-col mt-0.5 gap-0.5", {
                "space-y-0 mt-0 ml-0": sidebarCollapsed,
              })}
              static
            >
              {createNewFolder && <NewFavouriteFolder setCreateNewFolder={setCreateNewFolder} actionType="create" />}
              {favouriteIds
                .filter((id) => !favouriteMap[id].parent)
                .map((id, index) => (
                  <Tooltip
                    key={favouriteMap[id].id}
                    tooltipContent={
                      favouriteMap[id].entity_data ? favouriteMap[id].entity_data.name : favouriteMap[id].name
                    }
                    position="right"
                    className="ml-2"
                    disabled={!sidebarCollapsed}
                    isMobile={isMobile}
                  >
                    {favouriteMap[id].is_folder ? (
                      <FavouriteFolder
                        favourite={favouriteMap[id]}
                        isLastChild={index === favouriteIds.length - 1}
                        handleRemoveFromFavorites={handleRemoveFromFavorites}
                      />
                    ) : (
                      <FavouriteItem
                        favourite={favouriteMap[id]}
                        handleRemoveFromFavorites={handleRemoveFromFavorites}
                      />
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
