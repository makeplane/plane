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
import addonDocs from "@storybook/addon-docs";
import addonA11y from "@storybook/addon-a11y";
import addonDesigns from "@storybook/addon-designs";
import addonVitest from "@storybook/addon-vitest";
import "./tailwind.css";

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonDesigns(), addonVitest()],
  parameters: {
    controls: {
      matchers: {},
    },
  },
  tags: ["autodocs"],
});
