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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// constants
import { EPageAccess } from "@plane/constants";
// plane editor
import { LinkIcon, CopyIcon, LockIcon, NewTabIcon, TrashIcon, GlobeIcon } from "@plane/propel/icons";
// plane ui
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { DeletePageModal } from "@/components/pages/modals/delete-page-modal";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
// Import the custom menu hook
import { usePageActionsMenu } from "@/plane-web/hooks/use-page-actions-menu";
// store types
import type { TPageInstance } from "@/store/pages/base-page";

export type TPageActions =
  | "full-screen"
  | "sticky-toolbar"
  | "copy-markdown"
  | "toggle-lock"
  | "toggle-access"
  | "open-in-new-tab"
  | "copy-link"
  | "make-a-copy"
  | "archive-restore"
  | "delete"
  | "version-history"
  | "export"
  | "move"
  | "remove-from-collection";

type Props = {
  extraOptions?: (TContextMenuItem & { key: TPageActions })[];
  optionsOrder: TPageActions[];
  page: TPageInstance;
  parentRef?: React.RefObject<HTMLElement>;
  storeType: EPageStoreType;
  realtimeEvents?: boolean;
};

export const PageActions = observer(function PageActions(props: Props) {
  const { extraOptions, optionsOrder, page, parentRef, storeType, realtimeEvents = true } = props;

  // states for common modals
  const [deletePageModal, setDeletePageModal] = useState(false);

  // page operations
  const { pageOperations } = usePageOperations({
    page,
  });

  // Get custom menu items and modals from the environment-specific implementation
  const { customMenuItems, ModalsComponent } = usePageActionsMenu({
    page,
    storeType,
    pageOperations,
  });

  // derived values
  const {
    access,
    archived_at,
    canCurrentUserChangeAccess,
    canCurrentUserDeletePage,
    canCurrentUserDuplicatePage,
    isContentEditable,
  } = page;

  const isProjectPage = page.project_ids && page.project_ids.length > 0;
  // Base menu items that are common across all implementations
  const baseMenuItems: (TContextMenuItem & { key: TPageActions })[] = useMemo(
    () => [
      {
        key: "toggle-access",
        action: () => {
          pageOperations.toggleAccess();
        },
        title: access === EPageAccess.PUBLIC ? "Make private" : isProjectPage ? "Make public" : "Open to workspace",
        icon: access === EPageAccess.PUBLIC ? LockIcon : GlobeIcon,
        shouldRender: canCurrentUserChangeAccess && !archived_at && isContentEditable,
      },
      {
        key: "open-in-new-tab",
        action: pageOperations.openInNewTab,
        title: "Open in new tab",
        icon: NewTabIcon,
        shouldRender: true,
      },
      {
        key: "copy-link",
        action: pageOperations.copyLink,
        title: "Copy link",
        icon: LinkIcon,
        shouldRender: true,
      },
      {
        key: "make-a-copy",
        action: () => {
          pageOperations.duplicate(realtimeEvents);
        },
        title: "Make a copy",
        icon: CopyIcon,
        shouldRender: canCurrentUserDuplicatePage,
      },
      {
        key: "delete",
        action: () => {
          setDeletePageModal(true);
        },
        title: "Delete",
        icon: TrashIcon,
        shouldRender: canCurrentUserDeletePage && !!archived_at,
      },
    ],
    [
      access,
      archived_at,
      canCurrentUserChangeAccess,
      isProjectPage,
      canCurrentUserDeletePage,
      canCurrentUserDuplicatePage,
      pageOperations,
      realtimeEvents,
    ]
  );

  // Merge base menu items with custom menu items
  const MENU_ITEMS: (TContextMenuItem & { key: TPageActions })[] = useMemo(() => {
    // Start with base menu items
    const menuItems = [...baseMenuItems];

    // Add custom menu items
    customMenuItems.forEach((customItem) => {
      // Find if there's already an item with the same key
      const existingIndex = menuItems.findIndex((item) => item.key === customItem.key);

      if (existingIndex >= 0) {
        // Replace the existing item
        menuItems[existingIndex] = customItem;
      } else {
        // Add as a new item
        menuItems.push(customItem);
      }
    });

    // Add extra options if provided
    if (extraOptions) {
      menuItems.push(...extraOptions);
    }

    return menuItems;
  }, [baseMenuItems, customMenuItems, extraOptions]);

  // arrange options
  const arrangedOptions = useMemo<(TContextMenuItem & { key: TPageActions })[]>(
    () =>
      optionsOrder
        .map((key) => MENU_ITEMS.find((item) => item.key === key))
        .filter((item): item is TContextMenuItem & { key: TPageActions } => !!item),
    [optionsOrder, MENU_ITEMS]
  );

  return (
    <>
      <DeletePageModal
        isOpen={deletePageModal}
        onClose={() => setDeletePageModal(false)}
        page={page}
        storeType={storeType}
      />
      <ModalsComponent />
      {parentRef && <ContextMenu parentRef={parentRef} items={arrangedOptions} />}
      <CustomMenu placement="bottom-end" optionsClassName="max-h-[90vh]" ellipsis closeOnSelect>
        {arrangedOptions.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                item.action?.();
              }}
              className={cn("flex items-center gap-2", item.className)}
              disabled={item.disabled}
            >
              {item.customContent ?? (
                <>
                  {item.icon && <item.icon className="size-3" />}
                  {item.title}
                </>
              )}
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
