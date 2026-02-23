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

import preview from "#.storybook/preview";

import { AttachmentPreviewList } from "./attachment-preview-list";
import type { TAttachmentPreviewItem } from "./attachment-preview-list";

const sampleItems: TAttachmentPreviewItem[] = [
  { id: "1", name: "design-mockup.png", size: 2457600, extension: "png", status: "uploaded" },
  { id: "2", name: "requirements.pdf", size: 524288, extension: "pdf", status: "uploaded" },
  { id: "3", name: "recording.mp4", size: 15728640, extension: "mp4", status: "uploading" },
];

const meta = preview.meta({
  component: AttachmentPreviewList,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    items: sampleItems,
  },
});

export const Empty = meta.story({
  args: {
    items: [],
  },
});

export const AllUploaded = meta.story({
  args: {
    items: [
      { id: "1", name: "notes.txt", size: 1024, extension: "txt", status: "uploaded" },
      { id: "2", name: "main.tsx", size: 4096, extension: "tsx", status: "uploaded" },
    ],
  },
});

export const AllFileTypes = meta.story({
  args: {
    items: [
      { id: "1", name: "photo.jpg", size: 3145728, extension: "jpg", status: "uploaded" },
      { id: "2", name: "video.mp4", size: 15728640, extension: "mp4", status: "uploaded" },
      { id: "3", name: "song.mp3", size: 5242880, extension: "mp3", status: "uploaded" },
      { id: "4", name: "app.js", size: 2048, extension: "js", status: "uploaded" },
      { id: "5", name: "report.pdf", size: 524288, extension: "pdf", status: "uploaded" },
      { id: "6", name: "archive.zip", size: 10485760, extension: "zip", status: "uploaded" },
      { id: "7", name: "data.csv", size: 8192, extension: "csv", status: "uploaded" },
      { id: "8", name: "animation.gif", size: 1048576, extension: "gif", status: "uploading" },
    ],
  },
});

export const ZeroBytesFile = meta.story({
  args: {
    items: [{ id: "1", name: "empty.txt", size: 0, extension: "txt", status: "uploaded" }],
  },
});

export const LargeFiles = meta.story({
  args: {
    items: [
      { id: "1", name: "backup.tar.gz", size: 1073741824, extension: "gz", status: "uploaded" },
      { id: "2", name: "database.sql", size: 536870912, extension: "sql", status: "uploaded" },
    ],
  },
});
