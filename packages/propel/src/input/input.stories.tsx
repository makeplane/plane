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
import { expect } from "storybook/test";
import { Input } from "./index";

const meta = preview.meta({
  title: "Primitives/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    mode: {
      control: "select",
      options: ["primary", "transparent", "true-transparent"],
    },
    inputSize: {
      control: "select",
      options: ["xs", "sm", "md"],
    },
    hasError: {
      control: "boolean",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
    },
    autoComplete: {
      control: "select",
      options: ["on", "off"],
    },
    disabled: {
      control: "boolean",
    },
  },
});

export const Default = meta.story({
  args: { placeholder: "Enter text...", className: "w-[400px]" },
});

export const TypeTest = meta.story({
  args: {
    ...Default.composed.args,
  },
  async play({ canvas, userEvent }) {
    const input = canvas.getByPlaceholderText("Enter text...");
    await expect(input).toBeVisible();
    await userEvent.type(input, "Hello World");
    await expect(input).toHaveValue("Hello World");
  },
});

export const Primary = Default.extend({
  args: { mode: "primary", placeholder: "Primary input" },
});

export const Transparent = Default.extend({
  args: { mode: "transparent", placeholder: "Transparent input" },
});

export const TrueTransparent = Default.extend({
  args: { mode: "true-transparent", placeholder: "True transparent input" },
});

export const ExtraSmall = Default.extend({
  args: { inputSize: "xs", placeholder: "Extra small input" },
});

export const Small = Default.extend({
  args: { inputSize: "sm", placeholder: "Small input" },
});

export const Medium = Default.extend({
  args: { inputSize: "md", placeholder: "Medium input" },
});

export const WithError = Default.extend({
  args: { hasError: true, placeholder: "Input with error", defaultValue: "Invalid input" },
});

export const Disabled = Default.extend({
  args: { disabled: true, placeholder: "Disabled input", defaultValue: "Cannot edit this" },
});

export const WithValue = Default.extend({
  args: { defaultValue: "Pre-filled value", placeholder: "Input with value" },
});

export const Email = Default.extend({
  args: { type: "email", placeholder: "Enter your email", autoComplete: "on" },
});

export const Password = Default.extend({
  args: { type: "password", placeholder: "Enter your password", autoComplete: "off" },
});

export const Number = Default.extend({
  args: { type: "number", placeholder: "Enter a number" },
});

export const Search = Default.extend({
  args: { type: "search", placeholder: "Search..." },
});
