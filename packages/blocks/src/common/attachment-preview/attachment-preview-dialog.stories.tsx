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

import { expect, fn, within } from "storybook/test";
import preview from "#.storybook/preview";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";
import type { TAttachmentPreviewItem } from "./attachment-preview.types";

const sampleImage: TAttachmentPreviewItem = {
  id: "img-1",
  name: "screenshot.png",
  extension: "png",
  size: 245_760,
  kind: "image",
  previewSrc: "https://placehold.co/800x600",
  downloadSrc: "/download/img-1",
  openInNewTabSrc: "/inline/img-1",
  uploadedByLabel: "John Doe",
  uploadedAtLabel: "Apr 10, 2026",
};

const sampleVideo: TAttachmentPreviewItem = {
  id: "vid-1",
  name: "demo.mp4",
  extension: "mp4",
  size: 5_242_880,
  kind: "video",
  previewSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  downloadSrc: "/download/vid-1",
  openInNewTabSrc: "/inline/vid-1",
};

const sampleAudio: TAttachmentPreviewItem = {
  id: "aud-1",
  name: "recording.mp3",
  extension: "mp3",
  size: 3_145_728,
  kind: "audio",
  previewSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  downloadSrc: "/download/aud-1",
  openInNewTabSrc: "/inline/aud-1",
};

const samplePdf: TAttachmentPreviewItem = {
  id: "pdf-1",
  name: "document.pdf",
  extension: "pdf",
  size: 512_000,
  kind: "pdf",
  previewSrc: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  downloadSrc: "/download/pdf-1",
  openInNewTabSrc: "/inline/pdf-1",
};

const sampleText: TAttachmentPreviewItem = {
  id: "txt-1",
  name: "notes.md",
  extension: "md",
  size: 2048,
  kind: "text",
  previewSrc: "data:text/plain;base64,IyBIZWxsbwoKVGhpcyBpcyBhICoqdGVzdCoqIGZpbGUu",
  downloadSrc: "/download/txt-1",
  openInNewTabSrc: "/inline/txt-1",
};

const sampleUnsupported: TAttachmentPreviewItem = {
  id: "doc-1",
  name: "report.docx",
  extension: "docx",
  size: 1_048_576,
  kind: "unsupported",
  downloadSrc: "/download/doc-1",
  openInNewTabSrc: "/inline/doc-1",
};

const meta = preview.meta({
  title: "Common/AttachmentPreviewDialog",
  component: AttachmentPreviewDialog,
  parameters: { layout: "fullscreen" },
  args: {
    isOpen: true,
    onClose: fn(),
    item: sampleImage,
  },
});

/**
 * Query the fullscreen overlay portal.
 * The dialog renders via createPortal into the body,
 * so we scope queries to the overlay element.
 */
function getDialogScope(canvasElement: HTMLElement) {
  const dialog = canvasElement.ownerDocument.querySelector('[role="dialog"]');
  if (!dialog) throw new Error("Dialog portal not found — no element with role='dialog'");
  return within(dialog as HTMLElement);
}

export const ImagePreview = meta.story({
  async play({ canvasElement }) {
    const dialog = getDialogScope(canvasElement);
    await expect(dialog.getByText("screenshot.png")).toBeVisible();
    await expect(dialog.getByTestId("preview-image")).toBeVisible();
    await expect(dialog.getByRole("link", { name: /download/i })).toBeVisible();
  },
});

export const VideoPreview = meta.story({
  args: { item: sampleVideo },
  async play({ canvasElement }) {
    const dialog = getDialogScope(canvasElement);
    await expect(dialog.getByText("demo.mp4")).toBeVisible();
    await expect(dialog.getByTestId("preview-video")).toBeVisible();
  },
});

export const AudioPreview = meta.story({
  args: { item: sampleAudio },
  async play({ canvasElement }) {
    const dialog = getDialogScope(canvasElement);
    await expect(dialog.getByTestId("preview-audio")).toBeVisible();
  },
});

export const PdfPreview = meta.story({
  args: { item: samplePdf },
  async play({ canvasElement }) {
    const dialog = getDialogScope(canvasElement);
    await expect(dialog.getByText("document.pdf")).toBeVisible();
    await expect(dialog.getByTestId("preview-pdf")).toBeVisible();
  },
});

export const TextPreview = meta.story({
  args: { item: sampleText },
  async play({ canvasElement }) {
    const dialog = getDialogScope(canvasElement);
    await expect(dialog.getByText("notes.md")).toBeVisible();
    await expect(dialog.getByTestId("preview-text")).toBeVisible();
  },
});

export const UnsupportedPreview = meta.story({
  args: { item: sampleUnsupported },
  async play({ canvasElement }) {
    const dialog = getDialogScope(canvasElement);
    await expect(dialog.getByTestId("preview-fallback")).toBeVisible();
    await expect(dialog.getByRole("link", { name: /download/i })).toBeVisible();
  },
});
