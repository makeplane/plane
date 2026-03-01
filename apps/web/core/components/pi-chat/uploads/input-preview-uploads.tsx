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
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import type { TPiAttachment } from "@/types/pi-chat";
import { ImagePreview } from "./image-preview";
import { PreviewUploads } from "./root";
import { TemplatePreview } from "./template-preview";

type Props = {
  chatId: string | undefined;
  attachments: TPiAttachment[];
  setAttachments: (attachments: TPiAttachment[]) => void;
};

export const InputPreviewUploads = observer(function InputPreviewUploads(props: Props) {
  const { chatId, attachments, setAttachments } = props;
  const {
    attachmentStore: { getAttachmentsUploadStatusByChatId },
  } = usePiChat();
  const attachmentsUploadStatus = chatId && getAttachmentsUploadStatusByChatId(chatId);

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <PreviewUploads
          attachmentId={attachment.id}
          key={attachment.id}
          onRemove={() => handleRemoveAttachment(attachment.id)}
        />
      ))}
      {attachmentsUploadStatus &&
        attachmentsUploadStatus?.map((attachment) =>
          attachment.file_type && attachment.file_type.includes("image") ? (
            <ImagePreview
              attachment={attachment}
              loadingPercentage={attachment.progress}
              key={attachment.id}
              isLoading
            />
          ) : (
            <TemplatePreview
              attachment={attachment}
              loadingPercentage={attachment.progress}
              key={attachment.id}
              isLoading
            />
          )
        )}
    </div>
  );
});
