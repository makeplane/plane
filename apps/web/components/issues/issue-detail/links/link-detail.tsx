/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { DeleteOutline, EditOutline, NewTabOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { getIconForLink, copyTextToClipboard, calculateTimeAgo } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import type { TLinkOperationsModal } from "./create-update-link-modal";

export type TIssueLinkDetail = {
  linkId: string;
  linkOperations: TLinkOperationsModal;
  isNotAllowed: boolean;
};

export function IssueLinkDetail(props: TIssueLinkDetail) {
  const { t } = useTranslation();

  // props
  const { linkId, linkOperations, isNotAllowed } = props;
  // hooks
  const {
    toggleIssueLinkModal: toggleIssueLinkModalStore,
    link: { getLinkById },
    setIssueLinkData,
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { isMobile } = usePlatformOS();
  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  const Icon = getIconForLink(linkDetail.url);

  const toggleIssueLinkModal = (modalToggle: boolean) => {
    toggleIssueLinkModalStore(modalToggle);
    setIssueLinkData(linkDetail);
  };

  const createdByDetails = getUserDetails(linkDetail.created_by_id);

  return (
    <div key={linkId}>
      <div className="relative flex flex-col rounded-md bg-surface-2 p-2.5">
        <div
          role="presentation"
          className="flex w-full cursor-pointer items-start justify-between gap-2"
          onClick={() => {
            copyTextToClipboard(linkDetail.url);
            setToast({
              type: "success",
              title: t("link_copied"),
              message: t("common.link_copied_to_clipboard"),
            });
          }}
        >
          <button type="button" className="flex items-start gap-2 truncate text-left">
            <span className="py-1">
              <Icon className="size-3 flex-shrink-0 stroke-2 text-tertiary group-hover:text-primary" />
            </span>
            <Tooltip
              label={linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
              layout="stacked"
              disabled={isMobile}
            >
              <span className="truncate text-11">
                {linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
              </span>
            </Tooltip>
          </button>

          {!isNotAllowed && (
            <div className="z-[1] flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                className="flex items-center justify-center p-1 hover:bg-layer-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleIssueLinkModal(true);
                }}
              >
                <EditOutline className="h-3 w-3 stroke-[1.5] text-secondary" />
              </button>
              <a
                href={linkDetail.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-1 hover:bg-layer-1"
              >
                <NewTabOutline className="h-3 w-3 stroke-[1.5] text-secondary" />
              </a>
              <button
                type="button"
                className="flex items-center justify-center p-1 hover:bg-layer-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  linkOperations.remove(linkDetail.id);
                }}
              >
                <DeleteOutline className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="px-5">
          <p className="mt-0.5 stroke-[1.5] text-11 text-tertiary">
            {t("project.members_import.summary.stats.added")} {calculateTimeAgo(linkDetail.created_at)}
            <br />
            {createdByDetails && (
              <>
                {t("web_ui.by")}{" "}
                {createdByDetails?.is_bot ? createdByDetails?.first_name + " Bot" : createdByDetails?.display_name}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
