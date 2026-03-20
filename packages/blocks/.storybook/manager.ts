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

import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

const planeTheme = create({
  base: "dark",
  brandTitle: "Plane Blocks",
  brandUrl: "https://plane.so",
  brandImage: "plane-lockup-light.svg",
  brandTarget: "_self",
});

addons.setConfig({
  theme: planeTheme,
});
