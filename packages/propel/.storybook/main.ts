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

import tailwindcss from "@tailwindcss/vite";
import { defineMain } from "@storybook/react-vite/node";

export default defineMain({
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-designs",
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
  ],
  viteFinal: (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    config.define = {
      ...config.define,
      "process.env": {},
    };
    return config;
  },
});
