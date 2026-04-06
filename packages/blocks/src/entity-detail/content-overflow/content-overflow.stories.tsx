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
import { ContentOverflow } from "./content-overflow";

const LONG_TEXT = Array(20)
  .fill(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
  )
  .join(" ");

const SHORT_TEXT = "A short description that does not overflow.";

const meta = preview.meta({
  title: "EntityDetail/ContentOverflow",
  component: ContentOverflow,
  parameters: {
    layout: "centered",
  },
  args: {
    maxHeight: 140,
    showMoreLabel: "Show all",
    showLessLabel: "Show less",
  },
});

export const Overflowing = meta.story({
  args: {
    children: <div style={{ padding: 16, lineHeight: 1.6 }}>{LONG_TEXT}</div>,
  },
});

export const NotOverflowing = meta.story({
  args: {
    children: <div style={{ padding: 16 }}>{SHORT_TEXT}</div>,
  },
});

export const WithCustomButton = meta.story({
  args: {
    children: <div style={{ padding: 16, lineHeight: 1.6 }}>{LONG_TEXT}</div>,
    customButton: ({ toggle, isExpanded }) => (
      <button type="button" onClick={toggle} style={{ marginTop: 4, fontWeight: 600 }}>
        {isExpanded ? "Collapse" : "Expand"}
      </button>
    ),
  },
});

export const Empty = meta.story({
  args: {
    children: null,
    fallback: <div style={{ padding: 16, color: "gray" }}>No content available</div>,
  },
});
