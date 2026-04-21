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

export type AttachmentPreviewAudioProps = {
  src: string;
  name: string;
};

export function AttachmentPreviewAudio({ src, name }: AttachmentPreviewAudioProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4" data-testid="preview-audio">
      <p className="text-sm font-medium text-white/70">{name}</p>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- audio file preview, no captions available */}
      <audio controls src={src} className="w-full max-w-md">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
