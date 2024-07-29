"use client";

import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, FileText, Layers } from "lucide-react";
// ui
import { IFavourite } from "@plane/types";
import { ContrastIcon, DiceIcon, DragHandle, FavouriteFolderIcon, LayersIcon, Tooltip } from "@plane/ui";
// components
import { SidebarNavItem } from "@/components/sidebar";

// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components

export const FavouriteItem = observer(({ favourite }: { favourite: IFavourite }) => {
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();
  //state
  const [isDragging, setIsDragging] = useState(false);

  // router params
  const { workspaceSlug } = useParams();
  // derived values

  //ref
  const elementRef = useRef<HTMLAnchorElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

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

  return (
    <Link ref={elementRef} href={getLink()}>
      <SidebarNavItem
        key={favourite.id}
        className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
      >
        <div className="flex items-center gap-1.5 py-[1px]">
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
            <p className="text-sm leading-5 font-medium">
              {favourite.entity_data ? favourite.entity_data.name : favourite.name}
            </p>
          )}
        </div>
      </SidebarNavItem>
    </Link>
  );
});
