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
import { IconButton } from "./icon-button";

const icon = () => (
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
);

const meta = preview.meta({
  title: "Primitives/Icon Button",
  component: IconButton,
  parameters: {
    layout: "centered",
  },
  args: {
    icon,
  },
});

export const Default = meta.story({
  args: {
    onClick: fn(),
  },
});

export const ClickTest = Default.extend({
  async play({ canvas, userEvent, args }) {
    const button = canvas.getByRole("button");
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
});

export const Primary = Default.extend({ args: { variant: "primary" } });

export const ErrorFill = Default.extend({ args: { variant: "error-fill" } });

export const ErrorOutline = Default.extend({ args: { variant: "error-outline" } });

export const Secondary = Default.extend({ args: { variant: "secondary" } });

export const Tertiary = Default.extend({ args: { variant: "tertiary" } });

export const Ghost = Default.extend({ args: { variant: "ghost" } });

export const Small = Default.extend({ args: { size: "sm" } });

export const Base = Default.extend({ args: { size: "base" } });

export const Large = Default.extend({ args: { size: "lg" } });

export const ExtraLarge = Default.extend({ args: { size: "xl" } });

export const Loading = Default.extend({ args: { loading: true } });

export const Disabled = Default.extend({ args: { disabled: true } });
