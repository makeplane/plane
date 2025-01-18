"use client";

import { FC } from "react";
// hooks
// ui
import { observer } from "mobx-react";
import { Pencil, Trash2, ExternalLink, EllipsisVertical, Link2, Link } from "lucide-react";
import { TOAST_TYPE, setToast, CustomMenu, TContextMenuItem } from "@plane/ui";
// helpers
import { cn, copyTextToClipboard } from "@plane/utils";
import { calculateTimeAgo } from "@/helpers/date-time.helper";
import { useHome } from "@/hooks/store/use-home";
import { TLinkOperations } from "./use-links";

export type TProjectLinkDetail = {
  linkId: string;
  linkOperations: TLinkOperations;
};

export const ProjectLinkDetail: FC<TProjectLinkDetail> = observer((props) => {
  // props
  const { linkId, linkOperations } = props;
  // hooks
  const {
    quickLinks: { getLinkById, toggleLinkModal, setLinkData },
  } = useHome();

  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  const viewLink = linkDetail.url;

  const handleEdit = (modalToggle: boolean) => {
    toggleLinkModal(modalToggle);
    setLinkData(linkDetail);
  };

  const handleCopyText = () =>
    copyTextToClipboard(viewLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`${viewLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => handleEdit(true),
      title: "Edit",
      icon: Pencil,
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
      action: () => linkOperations.remove(linkId),
      title: "Delete",
      icon: Trash2,
    },
  ];

  return (
    <div
      onClick={handleOpenInNewTab}
      className="cursor-pointer group btn btn-primary flex bg-custom-background-100 px-4 w-[230px] h-[56px] border-[0.5px] border-custom-border-200 rounded-md gap-4 hover:shadow-md"
    >
      <div className="rounded p-2 bg-custom-background-80/40 w-8 h-8 my-auto">
        <Link2 className="h-4 w-4 stroke-2 text-custom-text-350 -rotate-45" />
      </div>
      <div className="my-auto flex-1">
        <div className="text-sm font-medium truncate">{linkDetail.title || linkDetail.url}</div>
        <div className="text-xs font-medium text-custom-text-400">{calculateTimeAgo(linkDetail.created_at)}</div>
      </div>

      <CustomMenu
        customButton={
          <EllipsisVertical className="opacity-0 h-4 w-4 stroke-2 text-custom-text-350 group-hover:opacity-100" />
        }
        placement="bottom-end"
        menuItemsClassName="z-20"
        closeOnSelect
        className=" my-auto"
      >
        {MENU_ITEMS.map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.action();
            }}
            className={cn("flex items-center gap-2 w-full ", {
              "text-custom-text-400": item.disabled,
            })}
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
        ))}
      </CustomMenu>
    </div>
  );
});
