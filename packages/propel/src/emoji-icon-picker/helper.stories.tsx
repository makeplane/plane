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
import {
  adjustColorForContrast,
  emojiToDecimalEnhanced,
  decimalToEmojiEnhanced,
  emojiToString,
  stringToEmoji,
  getEmojiSize,
  DEFAULT_COLORS,
} from "./helper";

/**
 * Wrapper component that displays function results for visual testing.
 */
function HelperShowcase({ fn, args, label }: { fn: (...args: never[]) => unknown; args: unknown[]; label: string }) {
  let result: string;
  let isError = false;
  try {
    const raw = fn(...(args as never[]));
    result = typeof raw === "string" ? raw : JSON.stringify(raw);
  } catch (e) {
    result = e instanceof Error ? e.message : String(e);
    isError = true;
  }
  return (
    <div className="flex items-center gap-3 p-2">
      <span className="text-13 text-tertiary font-medium min-w-[140px]">{label}:</span>
      <span className={`text-13 font-mono ${isError ? "text-red-500" : "text-secondary"}`} data-testid="result">
        {result}
      </span>
    </div>
  );
}

const meta = preview.meta({
  title: "Media/Emoji Icon Picker Helper",
  component: HelperShowcase,
  parameters: {
    layout: "padded",
  },
});

export const AdjustColorDarkHex = meta.story({
  render() {
    return (
      <div>
        <HelperShowcase fn={adjustColorForContrast} args={["#1a1a2e"]} label="Dark 6-char hex" />
        <HelperShowcase fn={adjustColorForContrast} args={["#000000"]} label="Black" />
        <HelperShowcase fn={adjustColorForContrast} args={["#333333"]} label="Dark gray" />
      </div>
    );
  },
});

export const AdjustColorLightHex = meta.story({
  render() {
    return (
      <div>
        <HelperShowcase fn={adjustColorForContrast} args={["#ffffff"]} label="White" />
        <HelperShowcase fn={adjustColorForContrast} args={["#f0f0f0"]} label="Light gray" />
        <HelperShowcase fn={adjustColorForContrast} args={["#ffff00"]} label="Yellow" />
      </div>
    );
  },
});

export const AdjustColorShortHex = meta.story({
  render() {
    return (
      <div>
        <HelperShowcase fn={adjustColorForContrast} args={["#fff"]} label="Short white" />
        <HelperShowcase fn={adjustColorForContrast} args={["#000"]} label="Short black" />
        <HelperShowcase fn={adjustColorForContrast} args={["#abc"]} label="Short hex" />
      </div>
    );
  },
});

export const AdjustColorInvalid = meta.story({
  render() {
    return (
      <div>
        <HelperShowcase fn={adjustColorForContrast} args={["invalid"]} label="Invalid string" />
        <HelperShowcase fn={adjustColorForContrast} args={["#gggggg"]} label="Invalid hex chars" />
        <HelperShowcase fn={adjustColorForContrast} args={[""]} label="Empty string" />
      </div>
    );
  },
});

export const EmojiToDecimal = meta.story({
  render() {
    return (
      <div>
        <HelperShowcase fn={emojiToDecimalEnhanced} args={["\u{1F600}"]} label="Grinning face" />
        <HelperShowcase fn={emojiToDecimalEnhanced} args={["\u{1F44D}\u{1F3FD}"]} label="Thumbs up medium" />
        <HelperShowcase fn={emojiToDecimalEnhanced} args={["A"]} label="Simple char" />
      </div>
    );
  },
});

export const DecimalToEmoji = meta.story({
  render() {
    return (
      <div>
        <HelperShowcase fn={decimalToEmojiEnhanced} args={[[128512]]} label="From decimal" />
        <HelperShowcase fn={decimalToEmojiEnhanced} args={[[128077, 127997]]} label="Thumbs up medium" />
        <HelperShowcase fn={decimalToEmojiEnhanced} args={[[65]]} label="From 65" />
      </div>
    );
  },
});

export const EmojiStringConversion = meta.story({
  render() {
    return (
      <div>
        <HelperShowcase fn={emojiToString} args={["\u{1F600}"]} label="Emoji to string" />
        <HelperShowcase fn={stringToEmoji} args={["128512"]} label="String to emoji" />
        <HelperShowcase fn={stringToEmoji} args={[""]} label="Empty string" />
        <HelperShowcase fn={stringToEmoji} args={["notanumber"]} label="Invalid string" />
      </div>
    );
  },
});

export const GetEmojiSizeAndColors = meta.story({
  render() {
    return (
      <div>
        <HelperShowcase fn={getEmojiSize} args={[16]} label="Size 16" />
        <HelperShowcase fn={getEmojiSize} args={[24]} label="Size 24" />
        <HelperShowcase fn={getEmojiSize} args={[32]} label="Size 32" />
        <div className="flex gap-2 p-2 mt-2">
          {DEFAULT_COLORS.map((color) => (
            <div
              key={color}
              className="size-6 rounded"
              style={{ backgroundColor: color }}
              data-testid={`color-${color}`}
            />
          ))}
        </div>
      </div>
    );
  },
});
