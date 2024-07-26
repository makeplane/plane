"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2, LinkIcon, ExternalLink } from "lucide-react";
// ui
import { Tooltip, TOAST_TYPE, setToast, CustomMenu } from "@plane/ui";
// helpers
import { calculateTimeAgoShort } from "@/helpers/date-time.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { TLinkOperationsModal } from "./create-update-link-modal";

type TIssueLinkItem = {
  linkId: string;
  linkOperations: TLinkOperationsModal;
  isNotAllowed: boolean;
};

export const IssueLinkItem: FC<TIssueLinkItem> = observer((props) => {
  // props
  const { linkId, linkOperations, isNotAllowed } = props;
  // hooks
  const {
    toggleIssueLinkModal: toggleIssueLinkModalStore,
    setIssueLinkData,
    link: { getLinkById },
  } = useIssueDetail();
  const { isMobile } = usePlatformOS();
  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  const toggleIssueLinkModal = (modalToggle: boolean) => {
    toggleIssueLinkModalStore(modalToggle);
    setIssueLinkData(linkDetail);
  };
  return (
    <>
      <div
        key={linkId}
        className="col-span-12 lg:col-span-6 xl:col-span-4 2xl:col-span-3 3xl:col-span-2 flex items-center justify-between gap-3 h-8 flex-shrink-0 px-3 bg-custom-background-90 border-[0.5px] border-custom-border-200 rounded"
      >
        <div className="flex items-center gap-2.5 truncate">
          <LinkIcon className="h-3 w-3 flex-shrink-0" />
          <Tooltip tooltipContent={linkDetail.url} isMobile={isMobile}>
            <span
              className="truncate text-xs cursor-pointer"
              onClick={() => {
                copyTextToClipboard(linkDetail.url);
                setToast({
                  type: TOAST_TYPE.SUCCESS,
                  title: "Link copied!",
                  message: "Link copied to clipboard",
                });
              }}
            >
              {linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
            </span>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1">
          <p className="p-1 text-xs align-bottom leading-5 text-custom-text-300">
            {calculateTimeAgoShort(linkDetail.created_at)}
          </p>
          <a
            href={linkDetail.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative grid place-items-center rounded p-1 text-custom-text-300 outline-none hover:text-custom-text-200 cursor-pointer hover:bg-custom-background-80"
          >
            <ExternalLink className="h-3.5 w-3.5 stroke-[1.5]" />
          </a>
          <CustomMenu
            ellipsis
            buttonClassName="text-custom-text-300 hover:text-custom-text-200"
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
              Edit
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                linkOperations.remove(linkDetail.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
