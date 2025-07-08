"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2, Copy, Link } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssueServiceType } from "@plane/types";
// ui
import { Tooltip, TOAST_TYPE, setToast, CustomMenu } from "@plane/ui";
import { calculateTimeAgo, copyTextToClipboard } from "@plane/utils";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { TLinkOperationsModal } from "./create-update-link-modal";

type TIssueLinkItem = {
  linkId: string;
  linkOperations: TLinkOperationsModal;
  isNotAllowed: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueLinkItem: FC<TIssueLinkItem> = observer((props) => {
  // props
  const { linkId, linkOperations, isNotAllowed, issueServiceType = EIssueServiceType.ISSUES } = props;
  // hooks
  const { t } = useTranslation();
  const {
    toggleIssueLinkModal: toggleIssueLinkModalStore,
    setIssueLinkData,
    link: { getLinkById },
  } = useIssueDetail(issueServiceType);
  const { isMobile } = usePlatformOS();
  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  // const Icon = getIconForLink(linkDetail.url);
  const faviconUrl: string | undefined = linkDetail.metadata?.favicon;
  const linkTitle: string | undefined = linkDetail.metadata?.title;

  const toggleIssueLinkModal = (modalToggle: boolean) => {
    toggleIssueLinkModalStore(modalToggle);
    setIssueLinkData(linkDetail);
  };
  return (
    <>
      <div
        key={linkId}
        className="group col-span-12 lg:col-span-6 xl:col-span-4 2xl:col-span-3 3xl:col-span-2 flex items-center justify-between gap-3 h-10 flex-shrink-0 px-3 bg-custom-background-90 hover:bg-custom-background-80 border-[0.5px] border-custom-border-200 rounded"
      >
        <div className="flex items-center gap-2.5 truncate flex-grow">
          {faviconUrl ? (
            <img src={faviconUrl} alt="favicon" className="size-4" />
          ) : (
            <Link className="size-4 text-custom-text-350 group-hover:text-custom-text-100" />
          )}
          <Tooltip tooltipContent={linkDetail.url} isMobile={isMobile}>
            <a
              href={linkDetail.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm cursor-pointer flex-grow flex items-center gap-3"
            >
              {linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}

              {linkTitle && linkTitle !== "" && <span className="text-custom-text-400 text-xs">{linkTitle}</span>}
            </a>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <p className="p-1 text-xs align-bottom leading-5 text-custom-text-400 group-hover-text-custom-text-200">
            {calculateTimeAgo(linkDetail.created_at)}
          </p>
          <span
            onClick={() => {
              copyTextToClipboard(linkDetail.url);
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: t("common.link_copied"),
                message: t("common.link_copied_to_clipboard"),
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
              {t("common.actions.edit")}
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
              {t("common.actions.delete")}
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
