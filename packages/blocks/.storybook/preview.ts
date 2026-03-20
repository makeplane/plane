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

import { definePreview } from "@storybook/react-vite";
import addonThemes, { withThemeByDataAttribute } from "@storybook/addon-themes";
import addonDocs from "@storybook/addon-docs";
import addonA11y from "@storybook/addon-a11y";
import addonDesigns from "@storybook/addon-designs";
import addonVitest from "@storybook/addon-vitest";
import "./tailwind.css";
import { themes } from "storybook/theming";

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonDesigns(), addonVitest(), addonThemes()],
  decorators: [
    withThemeByDataAttribute({
      themes: {
        Light: "light",
        Dark: "dark",
        "Light (High Contrast)": "light-contrast",
        "Dark (High Contrast)": "dark-contrast",
      },
      defaultTheme: "Light",
      attributeName: "data-theme",
    }),
  ],
  parameters: {
    controls: {
      matchers: {},
      sort: "requiredFirst",
    },
    backgrounds: {
      disable: true,
    },
  },
  tags: ["autodocs"],
});
