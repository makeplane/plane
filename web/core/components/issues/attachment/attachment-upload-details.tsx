"use client";

import { observer } from "mobx-react";
// ui
import { CircularProgressIndicator, Tooltip } from "@plane/ui";
// icons
import { getFileIcon } from "@/components/icons";
// helpers
import { getFileExtension } from "@/helpers/attachment.helper";
import { truncateText } from "@/helpers/string.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import { TAttachmentUploadStatus } from "@/store/issue/issue-details/attachment.store";

type Props = {
  uploadStatus: TAttachmentUploadStatus;
};

export const IssueAttachmentsUploadDetails: React.FC<Props> = observer((props) => {
  // props
  const { uploadStatus } = props;
  // derived values
  const fileName = uploadStatus.name;
  const fileExtension = getFileExtension(uploadStatus.name ?? "");
  const fileIcon = getFileIcon(fileExtension, 28);
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div className="flex h-[60px] items-center justify-between gap-1 rounded-md border-[2px] border-custom-border-200 bg-custom-background-90 px-4 py-2 text-sm pointer-events-none">
      <div className="flex-shrink-0 flex items-center gap-3">
        <div className="h-7 w-7">{fileIcon}</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Tooltip tooltipContent={fileName} isMobile={isMobile}>
              <span className="text-sm">{truncateText(`${fileName}`, 10)}</span>
            </Tooltip>
          </div>

          <div className="flex items-center gap-3 text-xs text-custom-text-200">
            <span>{fileExtension.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <span className="flex-shrink-0">
          <CircularProgressIndicator size={20} strokeWidth={3} percentage={uploadStatus.progress} />
        </span>
        <div className="flex-shrink-0 text-sm font-medium">{uploadStatus.progress}% done</div>
      </div>
    </div>
  );
});
