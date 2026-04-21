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

// plane imports
import { VideoPlayer } from "@plane/propel/video-player";

export type AttachmentPreviewVideoProps = {
  src: string;
};

export function AttachmentPreviewVideo({ src }: AttachmentPreviewVideoProps) {
  return (
    <div className="flex h-full w-full items-center justify-center" data-testid="preview-video">
      <VideoPlayer src={src} className="h-full max-h-full w-full max-w-full" />
    </div>
  );
}
