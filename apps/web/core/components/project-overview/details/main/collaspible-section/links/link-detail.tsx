/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
// hooks
import { observer } from "mobx-react";

import { CopyIcon, LinkIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { calculateTimeAgo, copyTextToClipboard } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectLinks } from "@/plane-web/hooks/store";
import type { TLinkOperationsModal } from "./create-update-link-modal";

export type TProjectLinkDetail = {
  linkId: string;
  linkOperations: TLinkOperationsModal;
  isNotAllowed: boolean;
};

export const ProjectLinkDetail = observer(function ProjectLinkDetail(props: TProjectLinkDetail) {
  // props
  const { linkId, linkOperations, isNotAllowed } = props;
  // hooks
  const { getLinkById, toggleLinkModal, setLinkData } = useProjectLinks();
  const { getUserDetails } = useMember();
  const { isMobile } = usePlatformOS();

  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  const faviconUrl: string | undefined = linkDetail.metadata?.favicon;
  const linkTitle: string | undefined = linkDetail.metadata?.title;

  const toggleProjectLinkModal = (modalToggle: boolean) => {
    toggleLinkModal(modalToggle);
    setLinkData(linkDetail);
  };

  const createdByDetails = getUserDetails(linkDetail.created_by_id);

  return (
    <div key={linkId}>
      <div className="relative flex flex-col rounded-md bg-layer-1 p-2.5">
        <div
          className="flex w-full cursor-pointer items-start justify-between gap-2"
          onClick={() => {
            window.open(linkDetail.url, "_blank");
          }}
        >
          <div className="flex items-start gap-2 truncate">
            <span className="py-1">
              {faviconUrl ? (
                <img src={faviconUrl} alt="favicon" className="size-3 flex-shrink-0" />
              ) : (
                <LinkIcon className="h-3 w-3 flex-shrink-0 text-tertiary" />
              )}
            </span>
            <div className="flex flex-col gap-0.5 truncate">
              <Tooltip tooltipContent={linkDetail.url} isMobile={isMobile}>
                <span className="truncate text-11">
                  {linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
                </span>
              </Tooltip>
              {linkTitle && linkTitle !== "" && <span className="text-placeholder text-11 truncate">{linkTitle}</span>}
            </div>
          </div>

          {!isNotAllowed && (
            <div className="z-[1] flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                className="flex items-center justify-center p-1 hover:bg-layer-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleProjectLinkModal(true);
                }}
              >
                <EditIcon className="h-3 w-3 stroke-[1.5] text-secondary" />
              </button>
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  copyTextToClipboard(linkDetail.url);
                  setToast({
                    type: TOAST_TYPE.SUCCESS,
                    title: "Link copied!",
                    message: "Link copied to clipboard",
                  });
                }}
                className="flex items-center justify-center p-1 hover:bg-layer-1"
              >
                <CopyIcon className="h-3 w-3 stroke-[1.5] text-secondary" />
              </span>
              <button
                type="button"
                className="flex items-center justify-center p-1 hover:bg-layer-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  linkOperations.remove(linkDetail.id);
                }}
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="px-5">
          <p className="mt-0.5 stroke-[1.5] text-11 text-tertiary">
            Added {calculateTimeAgo(linkDetail.created_at)}
            <br />
            {createdByDetails && (
              <>
                by {createdByDetails?.is_bot ? createdByDetails?.first_name + " Bot" : createdByDetails?.display_name}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
});
