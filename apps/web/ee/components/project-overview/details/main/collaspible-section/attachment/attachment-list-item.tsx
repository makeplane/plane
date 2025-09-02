"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Trash } from "lucide-react";
// plane imports
import { PROJECT_OVERVIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu } from "@plane/ui";
import { convertBytesToSize, getFileExtension, getFileName, getFileURL, renderFormattedDate } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { getFileIcon } from "@/components/icons";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";

type Props = {
  attachmentId: string;
  disabled?: boolean;
  toggleDeleteAttachmentModal: (attachmentId: string | null) => void;
};

export const ProjectAttachmentsListItem: FC<Props> = observer((props) => {
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
        <div className="group flex items-center justify-between gap-3 h-11 hover:bg-custom-background-90 pl-9 pr-2">
          <div className="flex items-center gap-3 text-sm truncate">
            <div className="flex items-center gap-3">{fileIcon}</div>
            <Tooltip tooltipContent={`${fileName}.${fileExtension}`} isMobile={isMobile}>
              <p className="text-custom-text-200 font-medium truncate">{`${fileName}.${fileExtension}`}</p>
            </Tooltip>
            <span className="flex size-1.5 bg-custom-background-80 rounded-full" />
            <span className="flex-shrink-0 text-custom-text-400">{convertBytesToSize(attachment.attributes.size)}</span>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleDeleteAttachmentModal(attachmentId);
                  captureClick({
                    elementName: PROJECT_OVERVIEW_TRACKER_ELEMENTS.ATTACHMENT_ITEM_CONTEXT_MENU,
                  });
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
