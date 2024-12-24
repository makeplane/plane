"use client";

import { FC } from "react";
// hooks
// ui
import { observer } from "mobx-react";
import { Pencil, Trash2, ExternalLink, Paperclip, EllipsisVertical, Link } from "lucide-react";
import { TOAST_TYPE, setToast, CustomMenu, TContextMenuItem } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { copyUrlToClipboard } from "@/helpers/string.helper";
import { useWorkspace } from "@/hooks/store";
import { TLinkOperations } from "./use-links";

export type TProjectLinkDetail = {
  linkId: string;
  linkOperations: TLinkOperations;
  isNotAllowed: boolean;
};

export const ProjectLinkDetail: FC<TProjectLinkDetail> = observer((props) => {
  // props
  const { linkId, linkOperations, isNotAllowed } = props;
  // hooks
  const {
    links: { getLinkById, toggleLinkModal, setLinkData },
  } = useWorkspace();

  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  const viewLink = linkDetail.url;

  const handleEdit = (modalToggle: boolean) => {
    toggleLinkModal(modalToggle);
    setLinkData(linkDetail);
  };

  const handleCopyText = () =>
    copyUrlToClipboard(viewLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${viewLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => handleEdit(true),
      title: "Edit",
      icon: Pencil,
      shouldRender: isNotAllowed,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: ExternalLink,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: Link,
    },
    {
      key: "delete",
      action: () => linkOperations.remove(),
      title: "Delete",
      icon: Trash2,
      shouldRender: isNotAllowed,
    },
  ];
  return (
    <div className="group btn btn-primary flex bg-custom-background-100 px-4 w-[230px] h-[56px] border-[0.5px] border-custom-border-200 rounded-md gap-4 hover:shadow-md">
      <div className="rounded p-2 bg-custom-background-80/40 w-8 h-8 my-auto">
        <Paperclip className="h-4 w-4 stroke-2 text-custom-text-350" />
      </div>
      <div className="my-auto flex-1">
        <div className="text-sm font-medium">Attachment</div>
        <div className="text-xs font-semibold text-custom-text-400">5 mins ago</div>
      </div>

      <CustomMenu
        customButton={<EllipsisVertical className="h-4 w-4 stroke-2 text-custom-text-350" />}
        placement="bottom-end"
        menuItemsClassName="z-20"
        closeOnSelect
        className=" my-auto"
      >
        <CustomMenu.MenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={cn("flex items-center gap-2")}
        >
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
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  );
});
