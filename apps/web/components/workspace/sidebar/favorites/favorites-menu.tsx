/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Collapsible } from "@makeplane/propel/components/collapsible";
import { CreateFolderOutline } from "@makeplane/propel/icons";
import { IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
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
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

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
  const elementRef = useRef<HTMLSpanElement>(null);

  const handleMoveToFolder = (sourceId: string, destinationId: string) => {
    moveFavoriteToFolder(workspaceSlug.toString(), sourceId, {
      parent: destinationId,
    }).catch(() => {
      setToast({
        type: "error",
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
          type: "success",
          title: t("success"),
          message: t("favorite_removed_successfully"),
        });
        return;
      })
      .catch(() => {
        setToast({
          type: "error",
          title: t("error"),
          message: t("something_went_wrong"),
        });
      });
  };

  const handleRemoveFromFavoritesFolder = (favoriteId: string) => {
    removeFromFavoriteFolder(workspaceSlug.toString(), favoriteId).catch(() => {
      setToast({
        type: "error",
        title: t("error"),
        message: t("failed_to_move_favorite"),
      });
    });
  };

  const handleReorder = useCallback(
    (favoriteId: string, droppedFavId: string, edge: string | undefined) => {
      reOrderFavorite(workspaceSlug.toString(), favoriteId, droppedFavId, edge).catch(() => {
        setToast({
          type: "error",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef.current, isDragging]);

  return (
    <>
      <Collapsible
        // the group marker lives on the root: CollapsibleHeader takes no className
        render={<div ref={containerRef} className="group/favorites-button" />}
        placement="sidebar"
        open={isFavoriteMenuOpen}
        onOpenChange={() => toggleFavoriteMenu(!isFavoriteMenuOpen)}
        trigger={
          <span
            ref={elementRef}
            className={cn("text-13 font-semibold whitespace-nowrap text-placeholder", {
              "bg-layer-1 opacity-60": isDragging,
            })}
          >
            {t("favorites")}
          </span>
        }
        trailing={
          <span className="pointer-events-none flex items-center opacity-0 group-hover/favorites-button:pointer-events-auto group-hover/favorites-button:opacity-100">
            <Tooltip label={t("create_folder")}>
              <IconButton
                variant="ghost"
                size="xs"
                onClick={() => {
                  setCreateNewFolder(true);
                  if (!isFavoriteMenuOpen) toggleFavoriteMenu(!isFavoriteMenuOpen);
                }}
                aria-label={t("aria_labels.projects_sidebar.create_favorites_folder")}
                icon={<Icon icon={CreateFolderOutline} />}
              />
            </Tooltip>
          </span>
        }
      >
        <div className="mt-0.5 flex flex-col gap-0.5">
          {createNewFolder && <NewFavoriteFolder setCreateNewFolder={setCreateNewFolder} actionType="create" />}
          {Object.keys(groupedFavorites).length === 0 ? (
            <>
              <span className="px-8 py-1.5 text-11 font-medium text-placeholder">{t("no_favorites_yet")}</span>
            </>
          ) : (
            orderBy(Object.values(groupedFavorites), "sequence", "desc")
              .filter((fav) => !fav.parent)
              .map((fav, index, { length }) => (
                <>
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
                </>
              ))
          )}
        </div>
      </Collapsible>
    </>
  );
});
