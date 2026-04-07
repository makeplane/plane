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

/* eslint-disable react-refresh/only-export-components */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { ChevronRight, Ellipsis, FolderX, Loader } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/propel/avatar";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { LinkIcon, PageIcon, RestrictedPageIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EPageAccess } from "@plane/types";
import type { TPage, TPageDragPayload, IUserLite } from "@plane/types";
import { copyUrlToClipboard, calculateTimeAgo, getFileURL } from "@plane/utils";
import { CustomMenu } from "@plane/ui";
import { useMember } from "@/hooks/store/use-member";
import { useCollection, EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export interface TCollectionPageRowData {
  page: TPage & { id: string; canCurrentUserAccessPage: boolean };
  ownerDetails: IUserLite | undefined;
  canCurrentUserAccessPage: boolean;
  nestedPagesCount: number;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isLoadingSubPages: boolean;
  onToggleExpand: () => void;
  onMovePage?: (payload: {
    draggedPageId: string;
    targetPageId: string;
    position: "before" | "after" | "inside";
  }) => void | Promise<void>;
  collectionId?: string;
}

type TUseCollectionPageColumnsProps = {
  canRemoveFromCollection: (pageId: string) => boolean;
  onRemoveFromCollection: (pageId: string) => void | Promise<void>;
};

const resolveDropPosition = (input: { clientY: number }, element: Element): "before" | "after" | "inside" => {
  if (!(element instanceof HTMLElement)) {
    return "inside";
  }

  const bounds = element.getBoundingClientRect();
  const y = input.clientY - bounds.top;
  const topThreshold = bounds.height * 0.25;
  const bottomThreshold = bounds.height * 0.75;

  if (y <= topThreshold) return "before";
  if (y >= bottomThreshold) return "after";
  return "inside";
};

export const CollectionPageRow = ({
  rowData,
  children,
  className,
}: {
  rowData: TCollectionPageRowData;
  children: React.ReactNode;
  className: string;
}) => {
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);
  const { workspaceSlug } = useParams();
  const collectionStore = useCollection();
  const { getPageById, isNestedPagesEnabled } = usePageStore(EPageStoreType.WORKSPACE);
  const targetPage = getPageById(rowData.page.id);

  useEffect(() => {
    const element = rowRef.current;
    if (!element || !targetPage?.id) return;
    const targetPageId = targetPage.id;
    const collectionId = rowData.collectionId;

    const clearExpandTimer = () => {
      if (!expandTimerRef.current) return;
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    };

    const initialData: TPageDragPayload = {
      id: targetPageId,
      parentId: targetPage.parent_id ?? null,
      collectionId: collectionId ?? null,
    };

    const cleanup = combine(
      draggable({
        element,
        dragHandle: element,
        getInitialData: () => initialData,
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        canDrag: () =>
          !!rowData.onMovePage &&
          !!collectionId &&
          collectionStore.canCurrentUserReorderPageInCollection(targetPageId, collectionId),
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element: currentElement }) => {
          const rawPosition = resolveDropPosition(input, currentElement);
          return {
            ...initialData,
            dropPosition: rowData.page.parent_id ? "inside" : rawPosition,
          };
        },
        onDrag: ({ self }) => {
          const nextDropPosition = (self.data as { dropPosition?: "before" | "after" | "inside" }).dropPosition ?? null;
          setDropPosition(nextDropPosition);

          if (nextDropPosition === "inside" && rowData.hasChildren && !rowData.isExpanded) {
            if (!expandTimerRef.current) {
              expandTimerRef.current = setTimeout(() => {
                rowData.onToggleExpand();
                expandTimerRef.current = null;
              }, 1000);
            }
          } else {
            clearExpandTimer();
          }
        },
        onDragLeave: () => {
          setDropPosition(null);
          clearExpandTimer();
        },
        onDrop: ({ source, self }) => {
          setDropPosition(null);
          clearExpandTimer();

          const { id: draggedPageId } = source.data as TPageDragPayload;
          const resolvedDropPosition = (self.data as { dropPosition?: "before" | "after" | "inside" }).dropPosition;

          if (!draggedPageId || draggedPageId === targetPageId || !resolvedDropPosition) return;
          if (
            resolvedDropPosition === "inside" &&
            (!workspaceSlug || !isNestedPagesEnabled(workspaceSlug.toString()))
          ) {
            return;
          }

          void rowData.onMovePage?.({
            draggedPageId,
            targetPageId,
            position: resolvedDropPosition,
          });
        },
        canDrop: ({ source }) => {
          if (!rowData.onMovePage || !workspaceSlug) return false;

          const { id: draggedPageId, parentId: draggedPageParentId } = source.data as TPageDragPayload;
          if (!draggedPageId) return false;

          const sourcePage = getPageById(draggedPageId);
          if (!sourcePage) return false;

          const isSamePage = draggedPageId === targetPageId;
          const isImmediateParent = draggedPageParentId === targetPageId;
          const isAnyLevelChild = targetPage.parentPageIds.includes(draggedPageId);

          if (isSamePage || isImmediateParent || isAnyLevelChild) return false;

          if (
            !sourcePage.canCurrentUserEditPage ||
            !sourcePage.isContentEditable ||
            !!sourcePage.archived_at ||
            sourcePage.access !== EPageAccess.PUBLIC ||
            (sourcePage.is_shared && !sourcePage.isCurrentUserOwner)
          ) {
            return false;
          }

          if (!collectionId || !collectionStore.canCurrentUserReorderPageInCollection(draggedPageId, collectionId)) {
            return false;
          }

          return true;
        },
      })
    );

    return () => {
      cleanup();
      clearExpandTimer();
    };
  }, [collectionStore, getPageById, isNestedPagesEnabled, rowData, targetPage, workspaceSlug]);

  return (
    <tr ref={rowRef} className={`${className} relative`}>
      {children}
      {dropPosition === "before" && (
        <td className="absolute inset-x-0 -top-px h-0.5 bg-accent-primary p-0" colSpan={999} />
      )}
      {dropPosition === "after" && (
        <td className="absolute inset-x-0 -bottom-px h-0.5 bg-accent-primary p-0" colSpan={999} />
      )}
      {dropPosition === "inside" && <td className="absolute inset-0 bg-accent-primary/10 p-0" colSpan={999} />}
      {isDragging && <td className="absolute inset-0 bg-layer-1/60 p-0" colSpan={999} />}
    </tr>
  );
};

const CollectionPageNameCell = ({
  rowData,
  workspaceSlug,
}: {
  rowData: TCollectionPageRowData;
  workspaceSlug: string;
}) => {
  const { t } = useTranslation();
  const pageName = rowData.page.name || t("wiki_collections.list.untitled");
  const isRestricted = !rowData.canCurrentUserAccessPage;
  const displayName = isRestricted
    ? t("wiki_collections.list.restricted_access")
    : pageName.length > 40
      ? `${pageName.slice(0, 40)}...`
      : pageName;
  const logoProps = rowData.page.logo_props;

  return (
    <div className="relative flex min-w-[280px] items-center" style={{ paddingLeft: `${rowData.depth * 20}px` }}>
      {rowData.isLoadingSubPages ? (
        <span className="-ml-5 mr-1 size-4 flex-shrink-0 grid place-items-center">
          <Loader className="size-3 animate-spin" />
        </span>
      ) : rowData.hasChildren ? (
        <button
          type="button"
          onClick={rowData.onToggleExpand}
          className="-ml-5 mr-0.5 flex-shrink-0 rounded p-0.5 hover:bg-layer-1-hover"
          aria-label={
            rowData.isExpanded ? t("wiki_collections.list.collapse_page") : t("wiki_collections.list.expand_page")
          }
        >
          <ChevronRight
            className={`size-3.5 text-tertiary transition-transform ${rowData.isExpanded ? "rotate-90" : ""}`}
          />
        </button>
      ) : null}
      <span className="mr-2 size-4 flex-shrink-0 grid place-items-center">
        {isRestricted ? (
          <RestrictedPageIcon className="size-4 text-tertiary" />
        ) : logoProps?.in_use ? (
          <Logo logo={logoProps} size={16} type="lucide" />
        ) : (
          <PageIcon className="size-4 text-tertiary" />
        )}
      </span>
      {isRestricted ? (
        <span className="truncate text-13 text-primary" title={t("wiki_collections.list.restricted_access")}>
          {displayName}
        </span>
      ) : (
        <Link
          href={`/${workspaceSlug}/wiki/${rowData.page.id}`}
          className="truncate text-13 text-primary"
          title={pageName}
        >
          {displayName}
        </Link>
      )}
    </div>
  );
};

const CollectionPageActionsCell = ({
  page,
  workspaceSlug,
  canRemoveFromCollection,
  onRemoveFromCollection,
}: {
  page: TPage & { id: string; canCurrentUserAccessPage: boolean };
  workspaceSlug: string;
  canRemoveFromCollection: (pageId: string) => boolean;
  onRemoveFromCollection: (pageId: string) => void | Promise<void>;
}) => {
  const { t } = useTranslation();
  if (!page.canCurrentUserAccessPage) return null;
  const canCurrentUserRemoveFromCollection = canRemoveFromCollection(page.id);

  return (
    <div className="flex w-12 justify-end">
      <CustomMenu
        customButton={
          <button
            type="button"
            className="grid size-6 place-items-center rounded-md border border-subtle transition-colors hover:bg-layer-1-hover"
            aria-label={t("wiki_collections.list.page_actions")}
          >
            <Ellipsis className="size-3.5 text-secondary" />
          </button>
        }
        placement="bottom-end"
        closeOnSelect
      >
        <CustomMenu.MenuItem
          onClick={() => {
            void copyUrlToClipboard(`${workspaceSlug}/wiki/${page.id}`).then(() => {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: t("common.link_copied"),
                message: t("wiki_collections.list.page_link_copied"),
              });
              return undefined;
            });
          }}
        >
          <div className="flex items-center gap-2">
            <LinkIcon className="size-3.5" />
            {t("common.actions.copy_link")}
          </div>
        </CustomMenu.MenuItem>
        {canCurrentUserRemoveFromCollection && (
          <CustomMenu.MenuItem onClick={() => void onRemoveFromCollection(page.id)}>
            <div className="flex items-center gap-2 text-danger-strong">
              <FolderX className="size-3.5" />
              {t("page_actions.remove_from_collection.label")}
            </div>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu>
    </div>
  );
};

export const useCollectionPageColumns = (props: TUseCollectionPageColumnsProps) => {
  const { canRemoveFromCollection, onRemoveFromCollection } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { getUserDetails } = useMember();

  const columns = [
    {
      key: "name",
      content: t("wiki_collections.list.columns.page_name"),
      thRender: () => <span>{t("wiki_collections.list.columns.page_name")}</span>,
      tdRender: (rowData: TCollectionPageRowData) => (
        <CollectionPageNameCell rowData={rowData} workspaceSlug={workspaceSlug?.toString() ?? ""} />
      ),
    },
    {
      key: "owner",
      content: t("wiki_collections.list.columns.owner"),
      tdRender: (rowData: TCollectionPageRowData) => {
        const { ownerDetails } = rowData;
        if (!ownerDetails) return <span className="text-placeholder text-sm">-</span>;

        const { display_name, first_name, last_name, id } = ownerDetails;
        const fullName = first_name && last_name ? `${first_name} ${last_name}` : display_name || t("unknown_user");

        return (
          <Link href={`/${workspaceSlug}/profile/${id}`} className="flex w-36 items-center gap-1.5">
            <Avatar
              src={getFileURL(ownerDetails.avatar_url ?? "")}
              name={display_name}
              size={16}
              className="flex-shrink-0"
            />
            <span className="truncate text-13 text-primary">{fullName}</span>
          </Link>
        );
      },
    },
    {
      key: "nested_pages",
      content: t("wiki_collections.list.columns.nested_pages"),
      tdRender: (rowData: TCollectionPageRowData) => (
        <div className="w-32">
          <span className="text-13">{rowData.nestedPagesCount}</span>
        </div>
      ),
    },
    {
      key: "last_activity",
      content: t("wiki_collections.list.columns.last_activity"),
      tdRender: (rowData: TCollectionPageRowData) => {
        const updatedAt = rowData.page.updated_at;
        if (!updatedAt) return <span className="text-placeholder">-</span>;

        return (
          <div className="w-32">
            <span className="text-13 text-primary">{calculateTimeAgo(updatedAt)}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      content: "",
      thRender: () => <span className="sr-only">{t("wiki_collections.list.columns.actions")}</span>,
      tdRender: (rowData: TCollectionPageRowData) => (
        <CollectionPageActionsCell
          page={rowData.page}
          workspaceSlug={workspaceSlug?.toString() ?? ""}
          canRemoveFromCollection={canRemoveFromCollection}
          onRemoveFromCollection={onRemoveFromCollection}
        />
      ),
    },
  ];

  return { columns, getUserDetails };
};
