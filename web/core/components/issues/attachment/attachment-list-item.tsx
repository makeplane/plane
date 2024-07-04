"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Trash } from "lucide-react";
// ui
import { CustomMenu, Tooltip } from "@plane/ui";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { getFileIcon } from "@/components/icons";
import { IssueAttachmentDeleteModal } from "@/components/issues";
// helpers
import { convertBytesToSize, getFileExtension, getFileName } from "@/helpers/attachment.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useIssueDetail, useMember } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import { TAttachmentOperations } from "./root";

type TAttachmentOperationsRemoveModal = Exclude<TAttachmentOperations, "create">;

type TIssueAttachmentsListItem = {
  attachmentId: string;
  handleAttachmentOperations: TAttachmentOperationsRemoveModal;
  disabled?: boolean;
};

export const IssueAttachmentsListItem: FC<TIssueAttachmentsListItem> = observer((props) => {
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
          data={attachment}
        />
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(attachment.asset, "_blank");
        }}
      >
        <div className="group flex items-center justify-between gap-3 h-11 hover:bg-custom-background-90 pl-9 pr-2">
          <div className="flex items-center gap-3 text-sm truncate">
            <div className="flex items-center gap-3  ">{getFileIcon(getFileExtension(attachment.asset), 18)}</div>
            <Tooltip
              tooltipContent={`${getFileName(attachment.attributes.name)}.${getFileExtension(attachment.asset)}`}
              isMobile={isMobile}
            >
              <p className="text-custom-text-200 font-medium truncate">{`${getFileName(attachment.attributes.name)}.${getFileExtension(attachment.asset)}`}</p>
            </Tooltip>
            <span className="flex size-1.5 bg-custom-background-80 rounded-full" />
            <span className="flex-shrink-0 text-custom-text-400">{convertBytesToSize(attachment.attributes.size)}</span>
          </div>

          <div className="flex items-center gap-3">
            {attachment?.updated_by && (
              <>
                <Tooltip
                  isMobile={isMobile}
                  tooltipContent={`${
                    getUserDetails(attachment.updated_by)?.display_name ?? ""
                  } uploaded on ${renderFormattedDate(attachment.updated_at)}`}
                >
                  <div className="flex items-center justify-center">
                    <ButtonAvatars showTooltip userIds={attachment?.updated_by} />
                  </div>
                </Tooltip>
              </>
            )}

            <CustomMenu ellipsis closeOnSelect placement="bottom-end" openOnHover disabled={disabled}>
              <CustomMenu.MenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDeleteIssueAttachmentModalOpen(true);
                }}
              >
                <div className="flex items-center gap-2">
                  <Trash className="h-3.5 w-3.5" strokeWidth={2} />
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
