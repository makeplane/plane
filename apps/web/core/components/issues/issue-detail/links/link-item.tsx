import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { LinkIcon, CopyIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
import { calculateTimeAgo, copyTextToClipboard } from "@plane/utils";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
import type { TLinkOperationsModal } from "./create-update-link-modal";

type TIssueLinkItem = {
  linkId: string;
  linkOperations: TLinkOperationsModal;
  isNotAllowed: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueLinkItem = observer(function IssueLinkItem(props: TIssueLinkItem) {
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
        className="group col-span-12 lg:col-span-6 xl:col-span-4 2xl:col-span-3 3xl:col-span-2 flex items-center justify-between gap-3 h-10 flex-shrink-0 px-3 bg-surface-2 hover:bg-layer-1 border-[0.5px] border-subtle rounded-sm"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {faviconUrl ? (
            <img src={faviconUrl} alt="favicon" className="size-4 flex-shrink-0" />
          ) : (
            <LinkIcon className="size-4 text-tertiary group-hover:text-primary flex-shrink-0" />
          )}
          <Tooltip tooltipContent={linkDetail.url} isMobile={isMobile}>
            <a
              href={linkDetail.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 w-0 text-body-xs-regular cursor-pointer flex items-center"
            >
              <span className="truncate flex-1 w-0">
                {linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
                {linkTitle && linkTitle !== "" && (
                  <span className="text-placeholder text-caption-sm-regular"> {linkTitle}</span>
                )}
              </span>
            </a>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <p className="p-1 text-caption-sm-regular align-bottom leading-5 text-placeholder group-hover-text-secondary">
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
            className="relative grid place-items-center rounded-sm p-1 text-placeholder outline-none group-hover:text-secondary cursor-pointer hover:bg-layer-1"
          >
            <CopyIcon className="h-3.5 w-3.5 stroke-[1.5]" />
          </span>
          <CustomMenu
            ellipsis
            buttonClassName="text-placeholder group-hover:text-secondary"
            placement="bottom-end"
            closeOnSelect
            disabled={isNotAllowed}
          >
            <CustomMenu.MenuItem
              className="flex items-center gap-2"
              onClick={() => {
                toggleIssueLinkModal(true);
              }}
            >
              <EditIcon className="h-3 w-3 stroke-[1.5] text-secondary" />
              {t("common.actions.edit")}
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem
              className="flex items-center gap-2"
              onClick={() => {
                linkOperations.remove(linkDetail.id);
              }}
            >
              <TrashIcon className="h-3 w-3" />
              {t("common.actions.delete")}
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
