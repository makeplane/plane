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

import { Pill, EPillVariant, EPillSize } from "./pill";

const meta = preview.meta({
  title: "Primitives/Pill",
  component: Pill,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Default",
  },
});

export const Default = meta.story({});

export const Primary = meta.story({
  args: {
    variant: EPillVariant.PRIMARY,
    children: "Primary",
  },
});

export const Success = meta.story({
  args: {
    variant: EPillVariant.SUCCESS,
    children: "Success",
  },
});

export const Warning = meta.story({
  args: {
    variant: EPillVariant.WARNING,
    children: "Warning",
  },
});

export const Error = meta.story({
  args: {
    variant: EPillVariant.ERROR,
    children: "Error",
  },
});

export const Info = meta.story({
  args: {
    variant: EPillVariant.INFO,
    children: "Info",
  },
});

export const Small = meta.story({
  args: {
    size: EPillSize.SM,
    children: "Small",
  },
});

export const Medium = meta.story({
  args: {
    size: EPillSize.MD,
    children: "Medium",
  },
});

export const Large = meta.story({
  args: {
    size: EPillSize.LG,
    children: "Large",
  },
});
