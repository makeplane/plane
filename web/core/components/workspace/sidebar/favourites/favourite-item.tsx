"use client";

import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, FileText, Layers, MoreHorizontal, Star } from "lucide-react";
// ui
import { IFavourite } from "@plane/types";
import { ContrastIcon, CustomMenu, DiceIcon, DragHandle, FavouriteFolderIcon, LayersIcon, Tooltip } from "@plane/ui";
// components
import { SidebarNavItem } from "@/components/sidebar";

// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const FavouriteItem = observer(
  ({
    favourite,
    handleRemoveFromFavorites,
  }: {
    favourite: IFavourite;
    handleRemoveFromFavorites: (favourite: IFavourite) => void;
  }) => {
    // store hooks
    const { sidebarCollapsed } = useAppTheme();
    const { isMobile } = usePlatformOS();
    //state
    const [isDragging, setIsDragging] = useState(false);
    const [isMenuActive, setIsMenuActive] = useState(false);

    // router params
    const { workspaceSlug } = useParams();
    // derived values

    //ref
    const elementRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLButtonElement | null>(null);
    const actionSectionRef = useRef<HTMLDivElement | null>(null);

    const getIcon = () => {
      const className = `flex-shrink-0 size-4 stroke-[1.5]`;

      switch (favourite.entity_type) {
        case "page":
          return <FileText className={className} />;
        case "project":
          return <Briefcase className={className} />;
        case "view":
          return <Layers className={className} />;
        case "module":
          return <DiceIcon className={className} />;
        case "cycle":
          return <ContrastIcon className={className} />;
        case "issue":
          return <LayersIcon className={className} />;
        case "folder":
          return <FavouriteFolderIcon className={className} />;
        default:
          return <FileText />;
      }
    };

    const getLink = () => {
      switch (favourite.entity_type) {
        case "project":
          return `/${workspaceSlug}/projects/${favourite.project_id}/issues`;
        case "cycle":
          return `/${workspaceSlug}/projects/${favourite.project_id}/cycles/${favourite.entity_identifier}`;
        case "module":
          return `/${workspaceSlug}/projects/${favourite.project_id}/modules/${favourite.entity_identifier}`;
        case "view":
          return `/${workspaceSlug}/projects/${favourite.project_id}/views/${favourite.entity_identifier}`;
        case "page":
          return `/${workspaceSlug}/projects/${favourite.project_id}/pages/${favourite.entity_identifier}`;
        default:
          return `/${workspaceSlug}`;
      }
    };

    useEffect(() => {
      const element = elementRef.current;

      if (!element) return;

      return combine(
        draggable({
          element,
          dragHandle: element,
          canDrag: () => true,
          getInitialData: () => ({ id: favourite.id, type: "CHILD" }),
          onDragStart: () => {
            setIsDragging(true);
          },
          onDrop: () => {
            setIsDragging(false);
          },
        })
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elementRef?.current, isDragging]);
    useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

    return (
      <div ref={elementRef} className="group/project-item">
        <SidebarNavItem
          key={favourite.id}
          className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
        >
          <div className="flex flex-between items-center gap-1.5 py-[1px] w-full">
            <Tooltip
              isMobile={isMobile}
              tooltipContent={favourite.sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"}
              position="top-right"
              disabled={isDragging}
            >
              <button
                type="button"
                className={cn(
                  "hidden group-hover/project-item:flex items-center justify-center absolute top-1/2 -left-3 -translate-y-1/2 rounded text-custom-sidebar-text-400 cursor-grab",
                  {
                    "cursor-not-allowed opacity-60": favourite.sort_order === null,
                    "cursor-grabbing": isDragging,
                    "!hidden": sidebarCollapsed,
                  }
                )}
                ref={dragHandleRef}
              >
                <DragHandle className="bg-transparent" />
              </button>
            </Tooltip>

            {getIcon()}

            {!sidebarCollapsed && (
              <Link href={getLink()} className="text-sm leading-5 font-medium flex-1">
                {favourite.entity_data ? favourite.entity_data.name : favourite.name}
              </Link>
            )}

            <CustomMenu
              customButton={
                <span
                  ref={actionSectionRef}
                  className="grid place-items-center p-0.5 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 rounded"
                  onClick={() => setIsMenuActive(!isMenuActive)}
                >
                  <MoreHorizontal className="size-4" />
                </span>
              }
              className={cn(
                "opacity-0 pointer-events-none flex-shrink-0 group-hover/project-item:opacity-100 group-hover/project-item:pointer-events-auto",
                {
                  "opacity-100 pointer-events-auto": isMenuActive,
                }
              )}
              customButtonClassName="grid place-items-center"
              placement="bottom-start"
            >
              <CustomMenu.MenuItem onClick={() => handleRemoveFromFavorites(favourite)}>
                <span className="flex items-center justify-start gap-2">
                  <Star className="h-3.5 w-3.5 fill-yellow-500 stroke-yellow-500" />
                  <span>Remove from favorites</span>
                </span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        </SidebarNavItem>
      </div>
    );
  }
);
