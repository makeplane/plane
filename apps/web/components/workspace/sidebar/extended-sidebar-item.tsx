/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { DragDropOutline, PinOutline, UnpinOutline } from "@makeplane/propel/icons";
// plane imports
import type { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ListItem, ListItemLabel } from "@makeplane/propel/components/list";
import { ListItemLink } from "@makeplane/propel/elements/list";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { DropIndicator } from "@plane/blocks/common";
import { cn } from "@plane/utils";
// components
import { UpgradeBadge } from "@/components/workspace/upgrade-badge";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useWorkspaceNavigationPreferences } from "@/hooks/use-navigation-preferences";
// local imports
import { getSidebarNavigationItemIcon } from "./helper";

type TExtendedSidebarItemProps = {
  item: IWorkspaceSidebarNavigationItem;
  handleOnNavigationItemDrop?: (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => void;
  disableDrag?: boolean;
  disableDrop?: boolean;
  isLastChild: boolean;
};

export const ExtendedSidebarItem = observer(function ExtendedSidebarItem(props: TExtendedSidebarItemProps) {
  const { item, handleOnNavigationItemDrop, disableDrag = false, disableDrop = false, isLastChild } = props;
  const { t } = useTranslation();
  // states
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);
  // refs
  const navigationIemRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  // nextjs hooks
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleExtendedSidebar } = useAppTheme();
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { preferences: workspacePreferences, toggleWorkspaceItem } = useWorkspaceNavigationPreferences();

  // derived values
  const isPinned = workspacePreferences.items[item.key]?.is_pinned ?? false;

  const handleLinkClick = () => toggleExtendedSidebar(true);

  useEffect(() => {
    const element = navigationIemRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => !disableDrag,
        dragHandle: dragHandleElement ?? undefined,
        getInitialData: () => ({ id: item.key, dragInstanceId: "NAVIGATION" }), // var1
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          !disableDrop && source?.data?.id !== item.key && source?.data?.dragInstanceId === "NAVIGATION",
        // oxlint-disable-next-line no-shadow
        getData: ({ input, element }) => {
          // oxlint-disable-next-line no-shadow
          const data = { id: item.key };

          // attach instruction for last in list
          return attachInstruction(data, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
          });
        },
        onDrag: ({ self }) => {
          const extractedInstruction = extractInstruction(self?.data)?.type;
          // check if the highlight is to be shown above or below
          setInstruction(
            extractedInstruction
              ? extractedInstruction === "reorder-below" && isLastChild
                ? "DRAG_BELOW"
                : "DRAG_OVER"
              : undefined
          );
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({ self, source }) => {
          setInstruction(undefined);
          const extractedInstruction = extractInstruction(self?.data)?.type;
          const currentInstruction = extractedInstruction
            ? extractedInstruction === "reorder-below" && isLastChild
              ? "DRAG_BELOW"
              : "DRAG_OVER"
            : undefined;
          if (!currentInstruction) return;

          const sourceId = source?.data?.id as string | undefined;
          const destinationId = self?.data?.id as string | undefined;

          if (handleOnNavigationItemDrop)
            handleOnNavigationItemDrop(sourceId, destinationId, currentInstruction === "DRAG_BELOW");
        },
      })
    );
  }, [isLastChild, handleOnNavigationItemDrop, disableDrag, disableDrop, item.key]);

  const itemHref =
    item.key === "your_work"
      ? `/${workspaceSlug.toString()}${item.href}${data?.id}`
      : `/${workspaceSlug.toString()}${item.href}`;
  const isActive = itemHref === pathname;

  const pinNavigationItem = (key: string) => {
    toggleWorkspaceItem(key, true);
  };

  const unPinNavigationItem = (key: string) => {
    toggleWorkspaceItem(key, false);
  };

  const icon = getSidebarNavigationItemIcon(item.key);

  if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())) {
    return null;
  }

  return (
    <div
      id={`sidebar-${item.key}`}
      className={cn("relative min-w-0", {
        "bg-layer-1 opacity-60": isDragging,
      })}
      ref={navigationIemRef}
    >
      <DropIndicator classNames="absolute top-0" isVisible={instruction === "DRAG_OVER"} />
      <div className="group/project-item relative" id={`${item.key}`}>
        {!disableDrag && (
          <Tooltip label={t("drag_to_rearrange")} align="start" disabled={isDragging}>
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              aria-label={t("drag_to_rearrange")}
              showTooltip={false}
              ref={dragHandleRef}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              render={(buttonProps) => (
                <button
                  {...buttonProps}
                  className={cn(
                    buttonProps.className,
                    "absolute top-1/2 -left-3 flex -translate-y-1/2 cursor-grab opacity-0 group-focus-within/project-item:opacity-100 group-hover/project-item:opacity-100",
                    {
                      "cursor-grabbing": isDragging,
                      "opacity-100": isDragging,
                    }
                  )}
                />
              )}
              icon={<Icon icon={DragDropOutline} tint="placeholder" />}
            />
          </Tooltip>
        )}
        <ListItem density="comfortable">
          <ListItemLink
            href={itemHref}
            render={<Link href={itemHref} />}
            onClick={() => handleLinkClick()}
            aria-current={isActive ? "page" : undefined}
          >
            {icon}
            <ListItemLabel>{t(item.labelTranslationKey)}</ListItemLabel>
          </ListItemLink>
          <div className="flex shrink-0 items-center gap-2">
            {item.key === "active_cycles" && (
              <div className="flex-shrink-0">
                <UpgradeBadge />
              </div>
            )}
            {isPinned ? (
              <Tooltip label={t("unpin")}>
                <IconButton
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-label={t("unpin")}
                  showTooltip={false}
                  icon={<Icon icon={UnpinOutline} tint="placeholder" />}
                  onClick={() => unPinNavigationItem(item.key)}
                />
              </Tooltip>
            ) : (
              <Tooltip label={t("pin")}>
                <IconButton
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-label={t("pin")}
                  showTooltip={false}
                  icon={<Icon icon={PinOutline} tint="placeholder" />}
                  onClick={() => pinNavigationItem(item.key)}
                />
              </Tooltip>
            )}
          </div>
        </ListItem>
      </div>
      {isLastChild && <DropIndicator isVisible={instruction === "DRAG_BELOW"} />}
    </div>
  );
});
