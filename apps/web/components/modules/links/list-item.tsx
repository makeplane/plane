/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

import { CopyOutline, DeleteOutline, EditOutline } from "@makeplane/propel/icons";
// plane types
import { Icon as PropelIcon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { ILinkDetails } from "@plane/types";
// plane ui
import { getIconForLink, copyTextToClipboard, calculateTimeAgo } from "@plane/utils";
// helpers
//
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  handleDeleteLink: () => void;
  handleEditLink: () => void;
  isEditingAllowed: boolean;
  link: ILinkDetails;
};

export const ModulesLinksListItem = observer(function ModulesLinksListItem(props: Props) {
  const { handleDeleteLink, handleEditLink, isEditingAllowed, link } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const createdByDetails = getUserDetails(link.created_by);
  // platform os
  const { isMobile } = usePlatformOS();

  const Icon = getIconForLink(link.url);

  const copyToClipboard = (text: string) => {
    copyTextToClipboard(text).then(() =>
      setToast({
        type: "success",
        title: "Copied to clipboard",
        message: "The URL has been successfully copied to your clipboard",
      })
    );
  };

  const linkLabel = link.title && link.title !== "" ? link.title : link.url;

  return (
    <div className="group/link flex w-full min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-layer-1-hover">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border-[0.5px] border-subtle bg-layer-2">
        <Icon className="size-4 text-secondary" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Tooltip label={linkLabel} layout="stacked" disabled={isMobile}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-full min-w-0 self-start truncate text-body-xs-medium text-primary"
          >
            {linkLabel}
          </a>
        </Tooltip>
        <p className="truncate text-caption-md-regular text-placeholder">
          Added {calculateTimeAgo(link.created_at)}{" "}
          {createdByDetails && (
            <>by {createdByDetails?.is_bot ? createdByDetails?.first_name + " Bot" : createdByDetails?.display_name}</>
          )}
        </p>
      </div>
      {/* Revealed on hover or focus; always shown on touch screens, which have no hover. */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-focus-within/link:opacity-100 group-hover/link:opacity-100 [@media(hover:none)]:opacity-100">
        {isEditingAllowed && (
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={t("edit")}
            icon={<PropelIcon icon={EditOutline} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEditLink();
            }}
          />
        )}
        <IconButton
          variant="ghost"
          size="xs"
          aria-label={t("copy_link")}
          icon={<PropelIcon icon={CopyOutline} />}
          onClick={() => copyToClipboard(link.url)}
        />
        {isEditingAllowed && (
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={t("delete")}
            icon={<PropelIcon icon={DeleteOutline} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDeleteLink();
            }}
          />
        )}
      </div>
    </div>
  );
});
