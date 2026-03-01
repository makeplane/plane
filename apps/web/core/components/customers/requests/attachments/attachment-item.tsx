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
import { observer } from "mobx-react";
import { TrashIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu } from "@plane/ui";
// components
// helpers
import { convertBytesToSize, getFileExtension, getFileName, getFileURL, renderFormattedDate } from "@plane/utils";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { getFileIcon } from "@/components/icons";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useCustomers } from "@/plane-web/hooks/store";

type TRequestAttachmentsListItem = {
  attachmentId: string;
  disabled?: boolean;
};

export const RequestAttachmentsListItem = observer(function RequestAttachmentsListItem(
  props: TRequestAttachmentsListItem
) {
  const { t } = useTranslation();
  // props
  const { attachmentId, disabled } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const {
    attachment: { getAttachmentById },
    toggleDeleteAttachmentModal,
  } = useCustomers();
  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;
  const fileName = getFileName(attachment?.attributes.name ?? "");
  const fileExtension = getFileExtension(attachment?.asset_url ?? "");
  const fileIcon = getFileIcon(fileExtension, 18);
  const fileURL = getFileURL(attachment?.asset_url ?? "");
  // hooks
  const { isMobile } = usePlatformOS();

  if (!attachment) return <></>;

  return (
    <button
      className="w-full bg-layer-1 rounded-md"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(fileURL, "_blank");
      }}
    >
      <div className="group flex items-center justify-between gap-3 h-11 hover:bg-layer-1 px-2">
        <div className="flex items-center gap-3 text-13 truncate">
          <div className="flex items-center gap-3">{fileIcon}</div>
          <Tooltip tooltipContent={`${fileName}.${fileExtension}`} isMobile={isMobile}>
            <p className="text-secondary font-medium truncate">{`${fileName}.${fileExtension}`}</p>
          </Tooltip>
          <span className="flex size-1.5 bg-layer-1 rounded-full" />
          <span className="flex-shrink-0 text-placeholder">{convertBytesToSize(attachment.attributes.size)}</span>
        </div>

        <div className="flex items-center gap-3">
          {attachment?.created_by && (
            <>
              <Tooltip
                isMobile={isMobile}
                tooltipContent={`${
                  getUserDetails(attachment?.created_by)?.display_name ?? ""
                } uploaded on ${renderFormattedDate(attachment.updated_at)}`}
              >
                <div className="flex items-center justify-center">
                  <ButtonAvatars showTooltip userIds={attachment?.created_by} />
                </div>
              </Tooltip>
            </>
          )}

          <CustomMenu ellipsis closeOnSelect placement="bottom-end" disabled={disabled}>
            <CustomMenu.MenuItem
              onClick={() => {
                toggleDeleteAttachmentModal(attachmentId);
              }}
            >
              <div className="flex items-center gap-2">
                <TrashIcon className="h-3.5 w-3.5" strokeWidth={2} />
                <span>{t("common.actions.delete")}</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </button>
  );
});
