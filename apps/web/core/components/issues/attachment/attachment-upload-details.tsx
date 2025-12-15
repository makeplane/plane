import { observer } from "mobx-react";
import { Tooltip } from "@plane/propel/tooltip";
import { CircularProgressIndicator } from "@plane/ui";
import { getFileExtension, truncateText } from "@plane/utils";
// ui
// icons
import { getFileIcon } from "@/components/icons";
// helpers
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import type { TAttachmentUploadStatus } from "@/store/issue/issue-details/attachment.store";

type Props = {
  uploadStatus: TAttachmentUploadStatus;
};

export const IssueAttachmentsUploadDetails = observer(function IssueAttachmentsUploadDetails(props: Props) {
  // props
  const { uploadStatus } = props;
  // derived values
  const fileName = uploadStatus.name;
  const fileExtension = getFileExtension(uploadStatus.name ?? "");
  const fileIcon = getFileIcon(fileExtension, 28);
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div className="flex h-[60px] items-center justify-between gap-1 rounded-md border-[2px] border-subtle bg-surface-2 px-4 py-2 text-13 pointer-events-none">
      <div className="flex-shrink-0 flex items-center gap-3">
        <div className="h-7 w-7">{fileIcon}</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Tooltip tooltipContent={fileName} isMobile={isMobile}>
              <span className="text-13">{truncateText(`${fileName}`, 10)}</span>
            </Tooltip>
          </div>

          <div className="flex items-center gap-3 text-11 text-secondary">
            <span>{fileExtension.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <span className="flex-shrink-0">
          <CircularProgressIndicator size={20} strokeWidth={3} percentage={uploadStatus.progress} />
        </span>
        <div className="flex-shrink-0 text-13 font-medium">{uploadStatus.progress}% done</div>
      </div>
    </div>
  );
});
