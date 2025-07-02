"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Copy, LinkIcon, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { CustomMenu, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// helpers
import { calculateTimeAgoShort, copyTextToClipboard } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeLink } from "@/plane-web/types/initiative";
// local components
import { TLinkOperationsModal } from "./link-list";

type TInitiativeLinkItem = {
  link: TInitiativeLink;
  linkOperations: TLinkOperationsModal;
  isNotAllowed: boolean;
};

export const IssueLinkItem: FC<TInitiativeLinkItem> = observer((props) => {
  // props
  const { link, linkOperations, isNotAllowed } = props;
  // hooks
  const {
    initiative: {
      initiativeLinks: { setLinkData, setIsLinkModalOpen },
    },
  } = useInitiatives();
  const { isMobile } = usePlatformOS();

  const { t } = useTranslation();

  if (!link) return <></>;

  const toggleIssueLinkModal = (modalToggle: boolean) => {
    setIsLinkModalOpen(modalToggle);
    setLinkData(link);
  };

  return (
    <>
      <div
        key={link.id}
        className="group col-span-12 lg:col-span-6 xl:col-span-4 2xl:col-span-3 3xl:col-span-2 flex items-center justify-between gap-3 h-10 flex-shrink-0 px-3 bg-custom-background-90 hover:bg-custom-background-80 border-[0.5px] border-custom-border-200 rounded"
      >
        <div className="flex items-center gap-2.5 truncate flex-grow">
          <LinkIcon className="size-4 flex-shrink-0 text-custom-text-400 group-hover:text-custom-text-200" />
          <Tooltip tooltipContent={link.url} isMobile={isMobile}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm cursor-pointer flex-grow"
            >
              {link.title && link.title !== "" ? link.title : link.url}
            </a>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <p className="p-1 text-xs align-bottom leading-5 text-custom-text-400 group-hover-text-custom-text-200">
            {calculateTimeAgoShort(link?.created_at)}
          </p>
          <span
            onClick={() => {
              copyTextToClipboard(link.url);
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Link copied!",
                message: "Link copied to clipboard",
              });
            }}
            className="relative grid place-items-center rounded p-1 text-custom-text-400 outline-none group-hover:text-custom-text-200 cursor-pointer hover:bg-custom-background-80"
          >
            <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
          </span>
          <CustomMenu
            ellipsis
            buttonClassName="text-custom-text-400 group-hover:text-custom-text-200"
            placement="bottom-end"
            closeOnSelect
            disabled={isNotAllowed}
          >
            <CustomMenu.MenuItem
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleIssueLinkModal(true);
              }}
            >
              <Pencil className="h-3 w-3 stroke-[1.5] text-custom-text-200" />
              {t("edit")}
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                linkOperations.remove(link.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
              {t("delete")}
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
