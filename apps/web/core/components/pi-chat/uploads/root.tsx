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
import { ImagePreview } from "./image-preview";
import { TemplatePreview } from "./template-preview";

type Props = {
  attachmentId: string;
  onRemove?: (id: string) => void;
};

export const PreviewUploads = observer(function PreviewUploads(props: Props) {
  const { attachmentId, onRemove } = props;
  const {
    attachmentStore: { getAttachmentById },
  } = usePiChat();
  const attachment = getAttachmentById(attachmentId);
  if (!attachment) return null;
  if (attachment.file_type.includes("image"))
    return <ImagePreview attachment={attachment} onRemove={onRemove ? () => onRemove(attachmentId) : undefined} />;
  return <TemplatePreview attachment={attachment} onRemove={onRemove ? () => onRemove(attachmentId) : undefined} />;
});
