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
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Switch } from "./root";

const meta = preview.meta({
  title: "Primitives/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  args: { value: false, onChange: fn() },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    const setValue = (newValue: boolean) => updateArgs({ value: newValue });
    return <Switch {...args} value={value} onChange={setValue} />;
  },
});

export const Default = meta.story({});

export const Checked = Default.extend({ args: { value: true } });

export const WithLabel = meta.story({
  args: { label: "Enable notifications" },
});

export const Small = Default.extend({ args: { size: "sm" } });

export const Medium = Default.extend({ args: { size: "md" } });

export const Large = Default.extend({ args: { size: "lg" } });

export const Disabled = Default.extend({ args: { disabled: true } });

export const DisabledChecked = Disabled.extend({ args: { value: true } });

export const WithDescription = meta.story({
  args: { size: "md", label: "Enable Two-Factor Authentication" },
});

export const Interactive = meta.story({
  args: { size: "md", label: "Feature Toggle" },
});

export const CustomStyles = meta.story({
  args: {
    size: "lg",
    className: "border-2 border-purple-300 data-[state=checked]:bg-purple-500",
  },
});
