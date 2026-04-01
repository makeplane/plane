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

import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gitHubEmojis, shortcodeToEmoji } from "@plane/editor/lib";

const emojiAssetSourceCache = new Map<string, string | null>();
const EXTENDED_PICTOGRAPHIC_PATTERN = /\p{Extended_Pictographic}/u;
const EMOJI_PRESENTATION_SELECTOR = 0xfe0f;
const EMOJI_PRESENTATION_SELECTOR_TEXT = "\uFE0F";
const TEXT_PRESENTATION_SELECTOR_TEXT = "\uFE0E";

const editorEmojiItems = gitHubEmojis.filter((emoji) => emoji.emoji);

const GOOGLE_EMOJI_PACKAGE_ROOT = (() => {
  try {
    const resolved = import.meta.resolve("emoji-datasource-google/package.json");
    return path.dirname(fileURLToPath(resolved));
  } catch {
    return null;
  }
})();

export const hasLocalEmojiAssetSupport = GOOGLE_EMOJI_PACKAGE_ROOT !== null;

const isValidCodePoint = (codePoint: number): boolean =>
  Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff;

const getSegmentCodePointCandidates = (segment: string): number[] => {
  if (/^\d+$/.test(segment)) {
    const decimalCodePoint = Number(segment);
    const hexCodePoint = Number.parseInt(segment, 16);

    return [...new Set([decimalCodePoint, hexCodePoint].filter(isValidCodePoint))];
  }

  if (/^[\da-f]+$/i.test(segment)) {
    const hexCodePoint = Number.parseInt(segment, 16);
    return isValidCodePoint(hexCodePoint) ? [hexCodePoint] : [];
  }

  return [];
};

const parseStoredEmojiCodePointCandidates = (emojiUnicode: string | undefined): number[][] => {
  if (!emojiUnicode) return [];

  const segments = emojiUnicode.split("-").map((segment) => segment.trim());
  let codePointCandidates: number[][] = [[]];

  for (const segment of segments) {
    const segmentCodePoints = getSegmentCodePointCandidates(segment);

    if (segmentCodePoints.length === 0) {
      return [];
    }

    codePointCandidates = codePointCandidates.flatMap((existingSequence) =>
      segmentCodePoints.map((codePoint) => [...existingSequence, codePoint])
    );
  }

  return [...new Map(codePointCandidates.map((candidate) => [candidate.join("-"), candidate])).values()];
};

const toEmojiAssetCodePoint = (codePoint: number): string =>
  codePoint
    .toString(16)
    .toLowerCase()
    .padStart(codePoint <= 0xffff ? 4 : 5, "0");

const buildEmojiAssetCandidates = (codePoints: number[]): string[] => {
  if (codePoints.length === 0) {
    return [];
  }

  const exactSequence = codePoints.map(toEmojiAssetCodePoint).join("-");
  const withoutVariationSelectors = codePoints.filter((codePoint) => codePoint !== 0xfe0f);
  const variationSelectorStrippedSequence = withoutVariationSelectors.map(toEmojiAssetCodePoint).join("-");

  return [...new Set([exactSequence, variationSelectorStrippedSequence].filter(Boolean))];
};

const getEmojiUnicodeFromText = (emojiText: string): string =>
  Array.from(emojiText)
    .map((character) => character.codePointAt(0))
    .filter((codePoint): codePoint is number => typeof codePoint === "number")
    .join("-");

export const getEmojiTextFromName = (emojiName: string | undefined): string => {
  if (!emojiName) {
    return "";
  }

  return shortcodeToEmoji(emojiName, editorEmojiItems)?.emoji || "";
};

export const resolveEmojiAssetSource = (emojiCode: string | undefined): string | null => {
  if (!emojiCode) {
    return null;
  }

  const cachedSource = emojiAssetSourceCache.get(emojiCode);
  if (cachedSource !== undefined) {
    return cachedSource;
  }

  if (!GOOGLE_EMOJI_PACKAGE_ROOT) {
    emojiAssetSourceCache.set(emojiCode, null);
    return null;
  }

  const candidateAssetSource = parseStoredEmojiCodePointCandidates(emojiCode)
    .flatMap((codePoints) => buildEmojiAssetCandidates(codePoints))
    .find((candidate) => {
      const assetPath = path.join(GOOGLE_EMOJI_PACKAGE_ROOT, "img/google/64", `${candidate}.png`);
      return existsSync(assetPath);
    });

  const resolvedSource = candidateAssetSource
    ? path.join(GOOGLE_EMOJI_PACKAGE_ROOT, "img/google/64", `${candidateAssetSource}.png`)
    : null;

  emojiAssetSourceCache.set(emojiCode, resolvedSource);
  return resolvedSource;
};

export const resolveStoredEmojiAssetSource = (emojiUnicode: string | undefined): string | null =>
  resolveEmojiAssetSource(emojiUnicode);

export const normalizeTextForPdfEmojiAssets = (text: string | undefined): string => {
  if (!text) {
    return "";
  }

  const characters = Array.from(text);

  return characters
    .map((character, index) => {
      if (!EXTENDED_PICTOGRAPHIC_PATTERN.test(character)) {
        return character;
      }

      const nextCharacter = characters[index + 1];
      if (nextCharacter === EMOJI_PRESENTATION_SELECTOR_TEXT || nextCharacter === TEXT_PRESENTATION_SELECTOR_TEXT) {
        return character;
      }

      const storedEmojiUnicode = getEmojiUnicodeFromText(character);
      if (!storedEmojiUnicode) {
        return character;
      }

      if (resolveEmojiAssetSource(storedEmojiUnicode)) {
        return character;
      }

      const emojiPresentationUnicode = `${storedEmojiUnicode}-${EMOJI_PRESENTATION_SELECTOR}`;
      return resolveEmojiAssetSource(emojiPresentationUnicode)
        ? `${character}${EMOJI_PRESENTATION_SELECTOR_TEXT}`
        : character;
    })
    .join("");
};
