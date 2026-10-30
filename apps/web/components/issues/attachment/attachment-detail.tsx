/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import Link from "next/link";
import { CloseOutline, WarningCircleOutline } from "@makeplane/propel/icons";
// ui
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { convertBytesToSize, getFileExtension, getFileName, getFileURL, renderFormattedDate } from "@plane/utils";
// icons
//
import { getFileIcon } from "@/components/icons";
// components
import { IssueAttachmentDeleteModal } from "@/components/issues/attachment/delete-attachment-modal";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import type { TAttachmentHelpers } from "../issue-detail-widgets/attachments/helper";

type TAttachmentOperationsRemoveModal = Exclude<TAttachmentHelpers, "create">;

type TIssueAttachmentsDetail = {
  attachmentId: string;
  attachmentHelpers: TAttachmentOperationsRemoveModal;
  disabled?: boolean;
};

export const IssueAttachmentsDetail = observer(function IssueAttachmentsDetail(props: TIssueAttachmentsDetail) {
  const { t } = useTranslation();
  // props
  const { attachmentId, attachmentHelpers, disabled } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const {
    attachment: { getAttachmentById },
  } = useIssueDetail();
  // state
  const [isDeleteIssueAttachmentModalOpen, setIsDeleteIssueAttachmentModalOpen] = useState(false);
  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;
  const fileName = getFileName(attachment?.attributes.name ?? "");
  const fileExtension = getFileExtension(attachment?.asset_url ?? "");
  const fileIcon = getFileIcon(fileExtension, 28);
  const fileURL = getFileURL(attachment?.asset_url ?? "");
  // hooks
  const { isMobile } = usePlatformOS();

  if (!attachment) return <></>;

  return (
    <>
      {isDeleteIssueAttachmentModalOpen && (
        <IssueAttachmentDeleteModal
          isOpen={isDeleteIssueAttachmentModalOpen}
          onClose={() => setIsDeleteIssueAttachmentModalOpen(false)}
          attachmentOperations={attachmentHelpers.operations}
          attachmentId={attachmentId}
        />
      )}
      <div className="flex h-[60px] items-center gap-3 rounded-lg border border-subtle-1 px-4 py-2">
        <Link
          href={fileURL ?? ""}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="grid size-7 shrink-0 place-items-center">{fileIcon}</div>
          <div className="flex min-w-0 flex-col">
            <Tooltip label={fileName} layout="stacked" disabled={isMobile}>
              <span className="truncate text-body-xs-medium text-primary">{fileName}</span>
            </Tooltip>
            <div className="flex items-center gap-2 text-caption-sm-regular text-tertiary">
              <span>{fileExtension.toUpperCase()}</span>
              <span>{convertBytesToSize(attachment.attributes.size)}</span>
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <Tooltip
            label={`${
              getUserDetails(attachment.updated_by)?.display_name ?? ""
            } uploaded on ${renderFormattedDate(attachment.updated_at)}`}
            layout="stacked"
            disabled={isMobile}
          >
            <span className="grid size-6 place-items-center text-tertiary">
              <WarningCircleOutline className="size-3.5" />
            </span>
          </Tooltip>
          {!disabled && (
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t("attachment.delete")}
              showTooltip={!isMobile}
              onClick={() => setIsDeleteIssueAttachmentModalOpen(true)}
              icon={<Icon icon={CloseOutline} />}
            />
          )}
        </div>
      </div>
    </>
  );
});
