/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import type {
  DragLocationHistory,
  DropTargetRecord,
  ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { orderBy } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
// ui
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IFavorite } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useFavorite } from "@/hooks/store/use-favorite";
import useLocalStorage from "@/hooks/use-local-storage";
// plane web components
import { FavoriteFolder } from "./favorite-folder";
import { FavoriteRoot } from "./favorite-items";
import type { TargetData } from "./favorites.helpers";
import { getInstructionFromPayload } from "./favorites.helpers";
import { NewFavoriteFolder } from "./new-fav-folder";
import { IconButton } from "@plane/propel/icon-button";

export const SidebarFavoritesMenu = observer(function SidebarFavoritesMenu() {
  // states
  const [createNewFolder, setCreateNewFolder] = useState<boolean | string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { groupedFavorites, deleteFavorite, removeFromFavoriteFolder, reOrderFavorite, moveFavoriteToFolder } =
    useFavorite();
  // translation
  const { t } = useTranslation();
  // local storage
  const { setValue: toggleFavoriteMenu, storedValue } = useLocalStorage<boolean>(IS_FAVORITE_MENU_OPEN, false);
  // derived values
  const isFavoriteMenuOpen = !!storedValue;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMoveToFolder = (sourceId: string, destinationId: string) => {
    moveFavoriteToFolder(workspaceSlug.toString(), sourceId, {
      parent: destinationId,
    }).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_move_favorite"),
      });
    });
  };

  const handleDrop = (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => {
    const isFolder = self.data?.isGroup;
    const dropTargets = location?.current?.dropTargets ?? [];
    if (!dropTargets || dropTargets.length <= 0) return;
    const dropTarget =
      dropTargets.length > 1 ? dropTargets.find((target: DropTargetRecord) => target?.data?.isChild) : dropTargets[0];

    const dropTargetData = dropTarget?.data as TargetData;

    if (!dropTarget || !dropTargetData) return;
    const instruction = getInstructionFromPayload(dropTarget, source, location);
    const parentId = instruction === "make-child" ? dropTargetData.id : dropTargetData.parentId;
    const droppedFavId = instruction !== "make-child" ? dropTargetData.id : undefined;
    const sourceData = source.data as TargetData;

    if (!sourceData.id) return;
    if (isFolder) {
      // handle move to a new parent folder if dropped on a folder
      if (parentId && parentId !== sourceData.parentId) {
        handleMoveToFolder(sourceData.id, parentId); /**parent id  */
      }
      // handle reordering at root level
      if (droppedFavId) {
        if (instruction != "make-child") {
          handleReorder(sourceData.id, droppedFavId, instruction); /** sequence */
        }
      }
    } else {
      //handling reordering for favorites
      if (droppedFavId) {
        handleReorder(sourceData.id, droppedFavId, instruction); /** sequence */
      }
    }

    /**remove if dropped outside and source is a child */
    if (!parentId && sourceData.isChild) {
      handleRemoveFromFavoritesFolder(sourceData.id); /**parent null */
    }
  };

  const handleRemoveFromFavorites = (favorite: IFavorite) => {
    deleteFavorite(workspaceSlug.toString(), favorite.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("favorite_removed_successfully"),
        });
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("something_went_wrong"),
        });
      });
  };

  const handleRemoveFromFavoritesFolder = (favoriteId: string) => {
    removeFromFavoriteFolder(workspaceSlug.toString(), favoriteId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_move_favorite"),
      });
    });
  };

  const handleReorder = useCallback(
    (favoriteId: string, droppedFavId: string, edge: string | undefined) => {
      reOrderFavorite(workspaceSlug.toString(), favoriteId, droppedFavId, edge).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("failed_to_reorder_favorite"),
        });
      });
    },
    [workspaceSlug, reOrderFavorite, t]
  );

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
        },
      })
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef.current, isDragging]);

  return (
    <>
      <Collapsible
        defaultOpen
        ref={containerRef}
        open={isFavoriteMenuOpen}
        onOpenChange={() => toggleFavoriteMenu(!isFavoriteMenuOpen)}
      >
        <div
          ref={elementRef}
          className={cn(
            "group/favorites-button w-full flex items-center justify-between px-1.5 py-2 rounded-sm text-placeholder hover:bg-layer-transparent-hover"
          )}
        >
          <CollapsibleTrigger
            type="button"
            className={cn(
              "w-full flex items-center gap-1 whitespace-nowrap text-left text-13 font-semibold text-placeholder",
              {
                "bg-layer-1 opacity-60": isDragging,
              }
            )}
            onClick={() => toggleFavoriteMenu(!isFavoriteMenuOpen)}
            aria-label={t(
              isFavoriteMenuOpen
                ? "aria_labels.projects_sidebar.close_favorites_menu"
                : "aria_labels.projects_sidebar.open_favorites_menu"
            )}
          >
            <span className="text-13 font-semibold">{t("favorites")}</span>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1 opacity-0 pointer-events-none group-hover/favorites-button:opacity-100 group-hover/favorites-button:pointer-events-auto">
            <Tooltip tooltipHeading={t("create_folder")} tooltipContent="">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreateNewFolder(true);
                  if (!isFavoriteMenuOpen) toggleFavoriteMenu(!isFavoriteMenuOpen);
                }}
                className="text-placeholder"
                aria-label={t("aria_labels.projects_sidebar.create_favorites_folder")}
                icon={FolderPlus}
              />
            </Tooltip>
            <IconButton
              variant="ghost"
              size="sm"
              icon={ChevronRightIcon}
              onClick={() => toggleFavoriteMenu(!isFavoriteMenuOpen)}
              className="text-placeholder"
              iconClassName={cn("transition-transform", {
                "rotate-90": isFavoriteMenuOpen,
              })}
              aria-label={t(
                isFavoriteMenuOpen
                  ? "aria_labels.projects_sidebar.close_favorites_menu"
                  : "aria_labels.projects_sidebar.open_favorites_menu"
              )}
            />
          </div>
        </div>
        {isFavoriteMenuOpen && (
          <CollapsibleContent className="flex flex-col gap-0.5 overflow-visible">
            {createNewFolder && <NewFavoriteFolder setCreateNewFolder={setCreateNewFolder} actionType="create" />}
            {Object.keys(groupedFavorites).length === 0 ? (
              <>
                <span className="text-placeholder text-11 font-medium px-8 py-1.5">{t("no_favorites_yet")}</span>
              </>
            ) : (
              orderBy(Object.values(groupedFavorites), "sequence", "desc")
                .filter((fav) => !fav.parent)
                .map((fav, index, { length }) => (
                  <Fragment key={fav.id}>
                    {fav?.is_folder ? (
                      <FavoriteFolder
                        favorite={fav}
                        isLastChild={index === length - 1}
                        handleRemoveFromFavorites={handleRemoveFromFavorites}
                        handleRemoveFromFavoritesFolder={handleRemoveFromFavoritesFolder}
                        handleDrop={handleDrop}
                      />
                    ) : (
                      <FavoriteRoot
                        workspaceSlug={workspaceSlug.toString()}
                        favorite={fav}
                        isLastChild={index === length - 1}
                        parentId={undefined}
                        handleRemoveFromFavorites={handleRemoveFromFavorites}
                        handleDrop={handleDrop}
                      />
                    )}
                  </Fragment>
                ))
            )}
          </CollapsibleContent>
        )}
      </Collapsible>
    </>
  );
});
