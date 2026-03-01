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

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Star, MoreHorizontal } from "lucide-react";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu, EModalWidth, EModalPosition, ModalCore } from "@plane/ui";
import { cn, joinUrlPath } from "@plane/utils";
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { ChatDeleteModal } from "../modals/delete-modal";
import { EditForm } from "../modals/edit-form";
import { useRouter } from "next/navigation";

type TProps = {
  isActive: boolean;
  chatId: string;
  title: string | undefined;
  workspaceSlug: string;
  isProjectLevel: boolean;
  isFavorite: boolean;
  optionToExclude?: string[];
  isFullScreen?: boolean;
  onClickItem: () => void;
};

export const SidebarItem = observer(function SidebarItem(props: TProps) {
  const {
    isActive,
    chatId,
    title,
    workspaceSlug,
    isProjectLevel,
    isFavorite,
    optionToExclude = [],
    isFullScreen = false,
    onClickItem,
  } = props;
  const router = useRouter();
  // state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  // translation
  const { t } = useTranslation();
  // hooks
  const { favoriteChat, unfavoriteChat, initPiChat } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString() || "")?.id;

  const handleFavorite = async () => {
    if (isFavorite) {
      await unfavoriteChat(chatId, workspaceId);
    } else {
      await favoriteChat(chatId, workspaceId);
    }
    setToast({
      title: isFavorite ? t("favorite_removed_successfully") : t("favorite_created_successfully"),
      type: TOAST_TYPE.SUCCESS,
    });
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "rename",
      title: t("rename"),
      icon: EditIcon,
      action: () => setIsEditModalOpen(true),
    },
    {
      key: "favorite",
      action: () => void handleFavorite(),
      title: isFavorite ? t("remove_from_favorites") : t("add_to_favorites"),
      icon: Star,
      iconClassName: isFavorite ? "fill-yellow-500 stroke-yellow-500" : "",
    },
    {
      key: "delete",
      action: () => setIsDeleteModalOpen(true),
      title: t("delete"),
      icon: TrashIcon,
    },
  ];
  return (
    <>
      {/* Delete Modal */}
      <ChatDeleteModal
        chatId={chatId}
        workspaceSlug={workspaceSlug?.toString() || ""}
        isOpen={isDeleteModalOpen}
        chatTitle={title || ""}
        onDelete={() => {
          if (!isActive) return;
          if (!isFullScreen) {
            initPiChat();
          } else {
            router.push(`/${workspaceSlug}/${isProjectLevel ? "projects/" : ""}ai-chat`);
          }
        }}
        handleClose={() => setIsDeleteModalOpen(false)}
      />
      {/* Edit Modal */}
      <ModalCore
        isOpen={isEditModalOpen}
        handleClose={() => setIsEditModalOpen(false)}
        position={EModalPosition.TOP}
        width={EModalWidth.SM}
      >
        <EditForm
          chatId={chatId}
          title={title || ""}
          handleModalClose={() => setIsEditModalOpen(false)}
          workspaceId={workspaceId}
        />
      </ModalCore>{" "}
      <div className="group/recent-chat">
        <SidebarNavItem isActive={isActive} className="gap-0">
          {isFullScreen ? (
            <Link
              href={joinUrlPath(workspaceSlug?.toString() || "", isProjectLevel ? "projects" : "", "ai-chat", chatId)}
              className="w-full overflow-hidden"
            >
              <div className="text-body-xs-medium text-secondary truncate capitalize"> {title || "No title"}</div>
            </Link>
          ) : (
            <button
              className="w-full overflow-hidden"
              onClick={() => {
                initPiChat(chatId);
                onClickItem();
              }}
            >
              <div className="text-body-xs-medium text-secondary truncate capitalize text-start">
                {title || "No title"}
              </div>
            </button>
          )}
          <CustomMenu
            customButton={
              <button
                className={cn(
                  "opacity-0 w-0 grid place-items-center p-0.5 text-placeholder bg-layer-transparent hover:bg-layer-transparent-hover rounded group-hover/recent-chat:w-auto group-hover/recent-chat:opacity-100 group-hover/recent-chat:ml-1 outline-none",
                  {
                    "w-auto opacity-100 ml-1": isMenuActive,
                  }
                )}
                onClick={() => setIsMenuActive(!isMenuActive)}
              >
                <MoreHorizontal className="size-4" />
              </button>
            }
            className={cn(
              "opacity-0 pointer-events-none flex-shrink-0 group-hover/recent-chat:opacity-100 group-hover/recent-chat:pointer-events-auto",
              {
                "opacity-100 pointer-events-auto": isMenuActive,
              }
            )}
            customButtonClassName="grid place-items-center"
            placement="bottom-start"
            useCaptureForOutsideClick
            closeOnSelect
            onMenuClose={() => setIsMenuActive(false)}
          >
            {MENU_ITEMS.filter((item) => !optionToExclude.includes(item.key)).map((item) => {
              if (item.shouldRender === false) return null;
              return (
                <CustomMenu.MenuItem
                  key={item.key}
                  onClick={() => {
                    item.action();
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    {
                      "text-placeholder": item.disabled,
                    },
                    item.className
                  )}
                  disabled={item.disabled}
                >
                  {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                  <div>
                    <h5 className="capitalize">{item.title}</h5>
                    {item.description && (
                      <p
                        className={cn("text-tertiary whitespace-pre-line", {
                          "text-placeholder": item.disabled,
                        })}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </CustomMenu.MenuItem>
              );
            })}
          </CustomMenu>
        </SidebarNavItem>
      </div>
    </>
  );
});
