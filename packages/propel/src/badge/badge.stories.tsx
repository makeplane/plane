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

import { Badge } from "./badge";

const meta = preview.meta({
  title: "Primitives/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Badge",
  },
});

export const Default = meta.story({});

export const Neutral = Default.extend({ args: { variant: "neutral", children: "Neutral Badge" } });

export const Brand = Default.extend({ args: { variant: "brand", children: "Brand Badge" } });

export const Warning = Default.extend({ args: { variant: "warning", children: "Warning Badge" } });

export const Success = Default.extend({ args: { variant: "success", children: "Success Badge" } });

export const Danger = Default.extend({ args: { variant: "danger", children: "Danger Badge" } });

export const Small = Default.extend({ args: { size: "sm", children: "Small Badge" } });

export const Base = Default.extend({ args: { size: "base", children: "Base Badge" } });

export const Large = Default.extend({ args: { size: "lg", children: "Large Badge" } });

export const WithPrependIcon = Default.extend({
  args: {
    prependIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14m-7-7h14" />
      </svg>
    ),
    children: "With Prepend Icon",
  },
});

export const WithAppendIcon = Default.extend({
  args: {
    appendIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    ),
    children: "With Append Icon",
  },
});
