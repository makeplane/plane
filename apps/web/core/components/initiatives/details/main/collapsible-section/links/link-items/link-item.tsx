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

import { observer } from "mobx-react";
import { CopyIcon, LinkIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu } from "@plane/ui";
// helpers
import { calculateTimeAgoShort, copyTextToClipboard } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeLink } from "@/types/initiative";
// local components
import type { TLinkOperationsModal } from "./link-list";

type TInitiativeLinkItem = {
  link: TInitiativeLink;
  linkOperations: TLinkOperationsModal;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export const InitiativeLinkItem = observer(function InitiativeLinkItem(props: TInitiativeLinkItem) {
  // props
  const { link, linkOperations, permissions } = props;
  // hooks
  const {
    initiative: {
      initiativeLinks: { setLinkData, setIsLinkModalOpen },
    },
  } = useInitiatives();
  const { isMobile } = usePlatformOS();

  const { t } = useTranslation();

  if (!link) return <></>;

  const faviconUrl: string | undefined = link.metadata?.favicon;
  const linkTitle: string | undefined = link.metadata?.title;

  const toggleInitiativeLinkModal = (modalToggle: boolean) => {
    setIsLinkModalOpen(modalToggle);
    setLinkData(link);
  };

  return (
    <>
      <div
        key={link.id}
        className="group col-span-12 lg:col-span-6 xl:col-span-4 2xl:col-span-3 3xl:col-span-2 flex items-center justify-between gap-3 h-10 shrink-0 px-3 bg-layer-1 hover:bg-layer-1-hover border-[0.5px] border-subtle rounded-md text-13"
      >
        <div className="flex items-center gap-2.5 truncate grow">
          {faviconUrl ? (
            <img src={faviconUrl} alt="favicon" className="size-3 shrink-0" />
          ) : (
            <LinkIcon className="size-3 shrink-0 text-placeholder group-hover:text-secondary" />
          )}
          <Tooltip tooltipContent={link.url} isMobile={isMobile}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-13 cursor-pointer grow flex items-center gap-3"
            >
              {link.title && link.title !== "" ? link.title : link.url}
              {linkTitle && linkTitle !== "" && <span className="text-placeholder text-11">{linkTitle}</span>}
            </a>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <p className="p-1 text-11 align-bottom leading-5 text-placeholder group-hover-text-secondary">
            {calculateTimeAgoShort(link?.created_at)}
          </p>
          <button
            onClick={() => {
              copyTextToClipboard(link.url);
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Link copied!",
                message: "Link copied to clipboard",
              });
            }}
            className="relative grid place-items-center rounded-sm p-1 text-placeholder outline-none group-hover:text-secondary cursor-pointer hover:bg-layer-1"
          >
            <CopyIcon className="h-3.5 w-3.5 stroke-[1.5]" />
          </button>
          <CustomMenu
            ellipsis
            buttonClassName="text-placeholder group-hover:text-secondary"
            placement="top-end"
            closeOnSelect
            disabled={!permissions.canEdit && !permissions.canDelete}
          >
            {permissions.canEdit && (
              <CustomMenu.MenuItem
                className="flex items-center gap-2"
                onClick={() => {
                  toggleInitiativeLinkModal(true);
                }}
              >
                <EditIcon className="h-3 w-3 stroke-[1.5] text-secondary" />
                {t("edit")}
              </CustomMenu.MenuItem>
            )}
            {permissions.canDelete && (
              <CustomMenu.MenuItem
                className="flex items-center gap-2"
                onClick={() => {
                  linkOperations.remove(link.id);
                }}
              >
                <TrashIcon className="h-3 w-3" />
                {t("delete")}
              </CustomMenu.MenuItem>
            )}
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
