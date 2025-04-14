"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import {
  Github,
  Figma,
  Notion,
  FileText,
  Globe,
  Link2,
  Youtube,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Dribbble,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  BookOpen,
  Mail,
  Chrome,
  Pencil,
  ExternalLink,
  Link,
  Trash2
} from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast, CustomMenu, TContextMenuItem } from "@plane/ui";
// plane utils
import { cn, copyTextToClipboard } from "@plane/utils";
// helpers
import { calculateTimeAgo } from "@/helpers/date-time.helper";
// hooks
import { useHome } from "@/hooks/store/use-home";
// types
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
  const { t } = useTranslation();

  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  const viewLink = linkDetail.url;
  const getIconForLink = (url: string) => {
    const lowerUrl = url.toLowerCase();
  
    // Social Media
    if (lowerUrl.indexOf("github.com") !== -1) return Github;
    if (lowerUrl.indexOf("linkedin.com") !== -1) return Linkedin;
    if (lowerUrl.indexOf("twitter.com") !== -1 || lowerUrl.indexOf("x.com") !== -1) return Twitter;
    if (lowerUrl.indexOf("facebook.com") !== -1) return Facebook;
    if (lowerUrl.indexOf("instagram.com") !== -1) return Instagram;
    if (lowerUrl.indexOf("youtube.com") !== -1 || lowerUrl.indexOf("youtu.be") !== -1) return Youtube;
    if (lowerUrl.indexOf("dribbble.com") !== -1) return Dribbble;
  
    // Productivity / Tools
    if (lowerUrl.indexOf("figma.com") !== -1) return Figma;
    if (lowerUrl.indexOf("notion.so") !== -1) return Notion;
    if (
      lowerUrl.indexOf("google.com") !== -1 ||
      lowerUrl.indexOf("docs.") !== -1 ||
      lowerUrl.indexOf("doc.") !== -1
    ) return FileText;
  
    // File types
    if (
      lowerUrl.indexOf(".jpg") !== -1 ||
      lowerUrl.indexOf(".jpeg") !== -1 ||
      lowerUrl.indexOf(".png") !== -1 ||
      lowerUrl.indexOf(".gif") !== -1 ||
      lowerUrl.indexOf(".bmp") !== -1 ||
      lowerUrl.indexOf(".svg") !== -1 ||
      lowerUrl.indexOf(".webp") !== -1
    ) return FileImage;
  
    if (
      lowerUrl.indexOf(".mp4") !== -1 ||
      lowerUrl.indexOf(".mov") !== -1 ||
      lowerUrl.indexOf(".avi") !== -1 ||
      lowerUrl.indexOf(".wmv") !== -1 ||
      lowerUrl.indexOf(".flv") !== -1 ||
      lowerUrl.indexOf(".mkv") !== -1
    ) return FileVideo;
  
    if (
      lowerUrl.indexOf(".mp3") !== -1 ||
      lowerUrl.indexOf(".wav") !== -1 ||
      lowerUrl.indexOf(".ogg") !== -1
    ) return FileAudio;
  
    if (
      lowerUrl.indexOf(".zip") !== -1 ||
      lowerUrl.indexOf(".rar") !== -1 ||
      lowerUrl.indexOf(".7z") !== -1 ||
      lowerUrl.indexOf(".tar") !== -1 ||
      lowerUrl.indexOf(".gz") !== -1
    ) return FileArchive;
  
    if (
      lowerUrl.indexOf(".xls") !== -1 ||
      lowerUrl.indexOf(".xlsx") !== -1 ||
      lowerUrl.indexOf(".csv") !== -1
    ) return FileSpreadsheet;
  
    if (
      lowerUrl.indexOf(".pdf") !== -1 ||
      lowerUrl.indexOf(".doc") !== -1 ||
      lowerUrl.indexOf(".docx") !== -1 ||
      lowerUrl.indexOf(".txt") !== -1
    ) return FileText;
  
    if (
      lowerUrl.indexOf(".html") !== -1 ||
      lowerUrl.indexOf(".js") !== -1 ||
      lowerUrl.indexOf(".ts") !== -1 ||
      lowerUrl.indexOf(".jsx") !== -1 ||
      lowerUrl.indexOf(".tsx") !== -1 ||
      lowerUrl.indexOf(".css") !== -1 ||
      lowerUrl.indexOf(".scss") !== -1
    ) return FileCode;
  
    // Other
    if (lowerUrl.indexOf("mailto:") !== -1) return Mail;
    if (lowerUrl.indexOf("http") === 0) return Chrome;
  
    return Link2;
  };

  const handleEdit = (modalToggle: boolean) => {
    toggleLinkModal(modalToggle);
    setLinkData(linkDetail);
  };

  const handleCopyText = () =>
    copyTextToClipboard(viewLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("view_link_copied_to_clipboard"),
      });
    });
  const handleOpenInNewTab = () => window.open(`${viewLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => handleEdit(true),
      title: t("edit"),
      icon: Pencil,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: t("open_in_new_tab"),
      icon: ExternalLink,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: Link,
    },
    {
      key: "delete",
      action: () => linkOperations.remove(linkId),
      title: t("delete"),
      icon: Trash2,
    },
  ];
  const Icon = getIconForLink(linkDetail.url);

  return (
    <div
      onClick={handleOpenInNewTab}
      className="cursor-pointer group flex items-center bg-custom-background-100 px-4 w-[230px] h-[56px] border-[0.5px] border-custom-border-200 rounded-md gap-4 hover:shadow-md transition-shadow"
    >
      <div className="flex-shrink-0 size-8 rounded p-2 bg-custom-background-80 grid place-items-center">
        <Icon className="size-4 stroke-2 text-custom-text-350" />
      </div>
      <div className="flex-1 truncate">
        <div className="text-sm font-medium truncate">{linkDetail.title || linkDetail.url}</div>
        <div className="text-xs font-medium text-custom-text-400">{calculateTimeAgo(linkDetail.created_at)}</div>
      </div>
      <div className="hidden group-hover:block">
        <CustomMenu placement="bottom-end" menuItemsClassName="z-20" closeOnSelect verticalEllipsis>
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
    </div>
  );
});
