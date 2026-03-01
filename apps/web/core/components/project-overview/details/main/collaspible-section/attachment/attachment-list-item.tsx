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
// plane imports
import { TrashIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu } from "@plane/ui";
import { convertBytesToSize, getFileExtension, getFileName, getFileURL, renderFormattedDate } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { getFileIcon } from "@/components/icons";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";

type Props = {
  attachmentId: string;
  disabled?: boolean;
  toggleDeleteAttachmentModal: (attachmentId: string | null) => void;
};

export const ProjectAttachmentsListItem = observer(function ProjectAttachmentsListItem(props: Props) {
  // props
  const { attachmentId, disabled, toggleDeleteAttachmentModal } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { getAttachmentById } = useProjectAttachments();
  const { isMobile } = usePlatformOS();

  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;
  const fileName = getFileName(attachment?.attributes.name ?? "");
  const fileExtension = getFileExtension(attachment?.asset ?? "");
  const fileIcon = getFileIcon(fileExtension, 18);
  const fileURL = getFileURL(attachment?.asset_url ?? "");

  if (!attachment) return <></>;

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(fileURL, "_blank");
        }}
      >
        <div className="group flex items-center justify-between gap-3 h-11 hover:bg-layer-1 pl-9 pr-2">
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
                    getUserDetails(attachment.created_by)?.display_name ?? ""
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
                  <span>Delete</span>
                </div>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        </div>
      </button>
    </>
  );
});
