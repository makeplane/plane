import { useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Star, Trash } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { CustomMenu, EModalPosition, EModalWidth, ModalCore, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import { calculateTimeAgo, cn } from "@plane/utils";
import { TUserThreads } from "@/plane-web/types";
import { ChatDeleteModal } from "../modals/delete-modal";
import { EditForm } from "../modals/edit-form";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

type TProps = {
  thread: TUserThreads;
};

export const PiChatListItem = observer((props: TProps) => {
  const { thread } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // router
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  // states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // hooks
  const { favoriteChat, unfavoriteChat } = usePiChat();

  const handleFavorite = async () => {
    if (thread.is_favorite) {
      await unfavoriteChat(thread.chat_id);
    } else {
      await favoriteChat(thread.chat_id);
    }
    setToast({
      title: thread.is_favorite ? t("favorite_removed_successfully") : t("favorite_created_successfully"),
      type: TOAST_TYPE.SUCCESS,
    });
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "rename",
      title: t("edit"),
      icon: Pencil,
      action: () => setIsEditModalOpen(true),
    },
    {
      key: "favorite",
      action: () => handleFavorite(),
      title: thread.is_favorite ? "Remove from favorites" : "Favorite",
      icon: Star,
      iconClassName: thread.is_favorite ? "fill-yellow-500 stroke-yellow-500" : "",
    },
    {
      key: "delete",
      action: () => setIsDeleteModalOpen(true),
      title: t("delete"),
      icon: Trash,
    },
  ];
  return (
    <>
      <ChatDeleteModal
        chatId={thread.chat_id}
        workspaceSlug={workspaceSlug?.toString() || ""}
        isOpen={isDeleteModalOpen}
        chatTitle={thread.title || ""}
        handleClose={() => setIsDeleteModalOpen(false)}
      />
      <ModalCore
        isOpen={isEditModalOpen}
        handleClose={() => setIsEditModalOpen(false)}
        position={EModalPosition.TOP}
        width={EModalWidth.SM}
      >
        <EditForm
          chatId={thread.chat_id}
          title={thread.title || ""}
          handleModalClose={() => setIsEditModalOpen(false)}
        />
      </ModalCore>
      <div className="flex justify-between items-end w-full" ref={parentRef}>
        <Link
          key={`${thread.chat_id}-${thread.last_modified}`}
          href={`/${workspaceSlug}/pi-chat/${thread.chat_id}`}
          className={cn(
            "w-full overflow-hidden py-4 flex-1 flex flex-col items-start gap-1 text-custom-text-200 truncate hover:text-custom-text-200 hover:bg-custom-background-90 pointer"
          )}
        >
          <div className="truncate text-base overflow-hidden"> {thread.title || "No title"}</div>
          <div className="text-sm text-custom-text-350 font-medium"> {calculateTimeAgo(thread.last_modified)}</div>
        </Link>
        <div className="py-4">
          <CustomMenu ellipsis placement="bottom-end" closeOnSelect maxHeight="lg">
            {MENU_ITEMS.map((item) => {
              if (item.shouldRender === false) return null;
              return (
                <CustomMenu.MenuItem
                  key={item.key}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.action();
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    {
                      "text-custom-text-400": item.disabled,
                    },
                    item.className
                  )}
                  disabled={item.disabled}
                >
                  {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                  <div>
                    <h5>{item.title}</h5>
                    {item.description && (
                      <p
                        className={cn("text-custom-text-300 whitespace-pre-line", {
                          "text-custom-text-400": item.disabled,
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
        </div>
      </div>
    </>
  );
});
