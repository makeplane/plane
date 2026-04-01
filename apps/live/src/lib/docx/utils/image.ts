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

import { ImageRun } from "docx";

const MAX_IMAGE_WIDTH = 600;
const MAX_IMAGE_HEIGHT = 500;

export type ImageDimensions = {
  width: number;
  height: number;
};

export type DocxImageType = "png" | "jpg" | "gif" | "bmp";

export type ImageInfo = ImageDimensions & {
  type: DocxImageType;
};

export const constrainDimensions = (
  width: number,
  height: number,
  maxWidth = MAX_IMAGE_WIDTH,
  maxHeight = MAX_IMAGE_HEIGHT
): ImageDimensions => {
  let w = width;
  let h = height;

  if (w > maxWidth) {
    const ratio = maxWidth / w;
    w = maxWidth;
    h = Math.round(h * ratio);
  }

  if (h > maxHeight) {
    const ratio = maxHeight / h;
    h = Math.round(h * ratio);
    w = Math.round(w * ratio);
  }

  return { width: w, height: h };
};

export const createImageRun = (
  data: Buffer | Uint8Array,
  width: number,
  height: number,
  customWidth?: number,
  type: DocxImageType = "png"
): ImageRun => {
  let dims: ImageDimensions;

  if (customWidth && customWidth < width) {
    const ratio = customWidth / width;
    dims = constrainDimensions(customWidth, Math.round(height * ratio));
  } else {
    dims = constrainDimensions(width, height);
  }

  return new ImageRun({
    data,
    transformation: dims,
    type,
  });
};

const getJpegDimensions = (buffer: Buffer): ImageDimensions | null => {
  let offset = 0;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    const segLen = buffer.readUInt16BE(offset + 2);
    offset += 2 + segLen;
  }
  return null;
};

const getPngDimensions = (buffer: Buffer): ImageDimensions | null => {
  if (buffer.length < 24) return null;
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

const getGifDimensions = (buffer: Buffer): ImageDimensions | null => {
  if (buffer.length < 10) return null;
  const header = buffer.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
};

const getBmpDimensions = (buffer: Buffer): ImageDimensions | null => {
  if (buffer.length < 26) return null;
  if (buffer.subarray(0, 2).toString("ascii") !== "BM") return null;
  return {
    width: buffer.readUInt32LE(18),
    height: Math.abs(buffer.readInt32LE(22)),
  };
};

export const getImageInfo = (buffer: Buffer): ImageInfo | null => {
  const png = getPngDimensions(buffer);
  if (png) return { ...png, type: "png" };

  const jpeg = getJpegDimensions(buffer);
  if (jpeg) return { ...jpeg, type: "jpg" };

  const gif = getGifDimensions(buffer);
  if (gif) return { ...gif, type: "gif" };

  const bmp = getBmpDimensions(buffer);
  if (bmp) return { ...bmp, type: "bmp" };

  return null;
};
