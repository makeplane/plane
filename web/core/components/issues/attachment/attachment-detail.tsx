"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
// ui
import { Tooltip } from "@plane/ui";
// icons
import { getFileIcon } from "@/components/icons";
// components
import { IssueAttachmentDeleteModal } from "@/components/issues";
// helpers
import { convertBytesToSize, getFileExtension, getFileName } from "@/helpers/attachment.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { truncateText } from "@/helpers/string.helper";
// hooks
import { useIssueDetail, useMember } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import { TAttachmentOperations } from "./root";

type TAttachmentOperationsRemoveModal = Exclude<TAttachmentOperations, "create">;

type TIssueAttachmentsDetail = {
  attachmentId: string;
  handleAttachmentOperations: TAttachmentOperationsRemoveModal;
  disabled?: boolean;
};

export const IssueAttachmentsDetail: FC<TIssueAttachmentsDetail> = observer((props) => {
  // props
  const { attachmentId, handleAttachmentOperations, disabled } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const {
    attachment: { getAttachmentById },
  } = useIssueDetail();
  // state
  const [isDeleteIssueAttachmentModalOpen, setIsDeleteIssueAttachmentModalOpen] = useState(false);
  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;
  // hooks
  const { isMobile } = usePlatformOS();

  if (!attachment) return <></>;

  return (
    <>
      {isDeleteIssueAttachmentModalOpen && (
        <IssueAttachmentDeleteModal
          isOpen={isDeleteIssueAttachmentModalOpen}
          onClose={() => setIsDeleteIssueAttachmentModalOpen(false)}
          handleAttachmentOperations={handleAttachmentOperations}
          attachmentId={attachmentId}
        />
      )}
      <div className="flex h-[60px] items-center justify-between gap-1 rounded-md border-[2px] border-custom-border-200 bg-custom-background-100 px-4 py-2 text-sm">
        <Link href={attachment.asset} target="_blank" rel="noopener noreferrer">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7">{getFileIcon(getFileExtension(attachment.asset), 28)}</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Tooltip tooltipContent={getFileName(attachment.attributes.name)} isMobile={isMobile}>
                  <span className="text-sm">{truncateText(`${getFileName(attachment.attributes.name)}`, 10)}</span>
                </Tooltip>
                <Tooltip
                  isMobile={isMobile}
                  tooltipContent={`${
                    getUserDetails(attachment.updated_by)?.display_name ?? ""
                  } uploaded on ${renderFormattedDate(attachment.updated_at)}`}
                >
                  <span>
                    <AlertCircle className="h-3 w-3" />
                  </span>
                </Tooltip>
              </div>

              <div className="flex items-center gap-3 text-xs text-custom-text-200">
                <span>{getFileExtension(attachment.asset).toUpperCase()}</span>
                <span>{convertBytesToSize(attachment.attributes.size)}</span>
              </div>
            </div>
          </div>
        </Link>

        {!disabled && (
          <button type="button" onClick={() => setIsDeleteIssueAttachmentModalOpen(true)}>
            <X className="h-4 w-4 text-custom-text-200 hover:text-custom-text-100" />
          </button>
        )}
      </div>
    </>
  );
});
