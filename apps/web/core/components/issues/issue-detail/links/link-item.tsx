/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { CopyOutline, DeleteOutline, EditOutline, LinkOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// ui
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
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
        className="group 3xl:col-span-2 col-span-12 flex h-10 flex-shrink-0 items-center justify-between gap-3 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-3 hover:bg-layer-1 lg:col-span-6 xl:col-span-4 2xl:col-span-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {faviconUrl ? (
            <img src={faviconUrl} alt="favicon" className="size-4 flex-shrink-0" />
          ) : (
            <LinkOutline className="size-4 flex-shrink-0 text-tertiary group-hover:text-primary" />
          )}
          <Tooltip label={linkDetail.url} layout="stacked" disabled={isMobile}>
            <a
              href={linkDetail.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-0 flex-1 cursor-pointer items-center text-body-xs-regular"
            >
              <span className="w-0 flex-1 truncate">
                {linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
                {linkTitle && linkTitle !== "" && (
                  <span className="text-caption-sm-regular text-placeholder"> {linkTitle}</span>
                )}
              </span>
            </a>
          </Tooltip>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <p className="group-hover-text-secondary p-1 align-bottom text-caption-sm-regular leading-5 text-placeholder">
            {calculateTimeAgo(linkDetail.created_at)}
          </p>
          <button
            type="button"
            aria-label={t("common.actions.copy_link")}
            onClick={() => {
              void copyTextToClipboard(linkDetail.url);
              setToast({
                type: "success",
                title: t("common.link_copied"),
                message: t("common.link_copied_to_clipboard"),
              });
            }}
            className="relative grid cursor-pointer place-items-center rounded-sm p-1 text-placeholder outline-none group-hover:text-secondary hover:bg-layer-1"
          >
            <CopyOutline className="h-3.5 w-3.5 stroke-[1.5]" />
          </button>
          <Menu>
            {/* Icon-only trigger, so it needs an explicit accessible name. */}
            <MenuTrigger
              render={
                <IconButton
                  variant="ghost"
                  size="sm"
                  disabled={isNotAllowed}
                  aria-label={t("aria_labels.common.more_actions")}
                  icon={<Icon icon={MoreHorizontalOutline} />}
                />
              }
            />
            <MenuContent side="bottom" align="end">
              <MenuItem
                icon={<Icon icon={EditOutline} />}
                label={t("common.actions.edit")}
                onClick={() => {
                  toggleIssueLinkModal(true);
                }}
              />
              <MenuItem
                icon={<Icon icon={DeleteOutline} />}
                label={t("common.actions.delete")}
                onClick={() => {
                  void linkOperations.remove(linkDetail.id);
                }}
              />
            </MenuContent>
          </Menu>
        </div>
      </div>
    </>
  );
});
