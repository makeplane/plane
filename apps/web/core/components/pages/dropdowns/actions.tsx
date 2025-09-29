"use client";
import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Copy, ExternalLink, Globe2, Link, Lock, Trash2 } from "lucide-react";
// constants
import { EPageAccess, PROJECT_PAGE_TRACKER_ELEMENTS } from "@plane/constants";
// plane editor
import type { EditorRefApi } from "@plane/editor";
// plane ui
import { ContextMenu, CustomMenu, TContextMenuItem } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { DeletePageModal } from "@/components/pages/modals/delete-page-modal";
// helpers
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { usePageOperations } from "@/hooks/use-page-operations";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
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
  | "move";

type Props = {
  editorRef?: EditorRefApi | null;
  extraOptions?: (TContextMenuItem & { key: TPageActions })[];
  optionsOrder: TPageActions[];
  page: TPageInstance;
  parentRef?: React.RefObject<HTMLElement>;
  storeType: EPageStoreType;
  realtimeEvents?: boolean;
};

export const PageActions: React.FC<Props> = observer((props) => {
  const { editorRef, extraOptions, optionsOrder, page, parentRef, storeType, realtimeEvents = true } = props;

  // states for common modals
  const [deletePageModal, setDeletePageModal] = useState(false);

  // page operations
  const { pageOperations } = usePageOperations({
    editorRef,
    page,
  });

  // Get custom menu items and modals from the environment-specific implementation
  const { customMenuItems, ModalsComponent } = usePageActionsMenu({
    page,
    storeType,
    pageOperations,
  });

  // derived values
  const { access, archived_at, canCurrentUserChangeAccess, canCurrentUserDeletePage, canCurrentUserDuplicatePage } =
    page;

  const isProjectPage = page.project_ids && page.project_ids.length > 0;
  // Base menu items that are common across all implementations
  const baseMenuItems: (TContextMenuItem & { key: TPageActions })[] = useMemo(
    () => [
      {
        key: "toggle-access",
        action: () => {
          captureClick({
            elementName: PROJECT_PAGE_TRACKER_ELEMENTS.ACCESS_TOGGLE,
          });
          pageOperations.toggleAccess();
        },
        title: access === EPageAccess.PUBLIC ? "Make private" : isProjectPage ? "Make public" : "Open to workspace",
        icon: access === EPageAccess.PUBLIC ? Lock : Globe2,
        shouldRender: canCurrentUserChangeAccess && !archived_at,
      },
      {
        key: "open-in-new-tab",
        action: pageOperations.openInNewTab,
        title: "Open in new tab",
        icon: ExternalLink,
        shouldRender: true,
      },
      {
        key: "copy-link",
        action: pageOperations.copyLink,
        title: "Copy link",
        icon: Link,
        shouldRender: true,
      },
      {
        key: "make-a-copy",
        action: () => {
          captureClick({
            elementName: PROJECT_PAGE_TRACKER_ELEMENTS.DUPLICATE_BUTTON,
          });
          pageOperations.duplicate(realtimeEvents);
        },
        title: "Make a copy",
        icon: Copy,
        shouldRender: canCurrentUserDuplicatePage,
      },
      {
        key: "delete",
        action: () => {
          captureClick({
            elementName: PROJECT_PAGE_TRACKER_ELEMENTS.CONTEXT_MENU,
          });
          setDeletePageModal(true);
        },
        title: "Delete",
        icon: Trash2,
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
  const arrangedOptions = useMemo(
    () =>
      optionsOrder
        .map((key) => MENU_ITEMS.find((item) => item.key === key))
        .filter((item) => !!item) as (TContextMenuItem & { key: TPageActions })[],
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
