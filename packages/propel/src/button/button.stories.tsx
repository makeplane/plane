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
import { expect, fn } from "storybook/test";
import { Button } from "./button";

const meta = preview.meta({
  component: Button,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Button",
  },
});

export const Default = meta.story({
  args: {
    onClick: fn(),
  },
});

export const ClickTest = meta.story({
  args: {
    ...Default.composed.args,
  },
  async play({ canvas, userEvent, args }) {
    const button = canvas.getByRole("button");
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
});

export const Primary = Default.extend({ args: { variant: "primary", children: "Primary Button" } });

export const ErrorFill = Default.extend({ args: { variant: "error-fill", children: "Error Button" } });

export const ErrorOutline = Default.extend({ args: { variant: "error-outline", children: "Error Outline Button" } });

export const Secondary = Default.extend({ args: { variant: "secondary", children: "Secondary Button" } });

export const Tertiary = Default.extend({ args: { variant: "tertiary", children: "Tertiary Button" } });

export const Ghost = Default.extend({ args: { variant: "ghost", children: "Ghost Button" } });

export const Link = Default.extend({ args: { variant: "link", children: "Link Button" } });

export const Small = Default.extend({ args: { size: "sm", children: "Small Button" } });

export const Base = Default.extend({ args: { size: "base", children: "Base Button" } });

export const Large = Default.extend({ args: { size: "lg", children: "Large Button" } });

export const ExtraLarge = Default.extend({ args: { size: "xl", children: "Extra Large Button" } });

export const Loading = Default.extend({ args: { loading: true, children: "Loading Button" } });

export const Disabled = Default.extend({ args: { disabled: true, children: "Disabled Button" } });

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
