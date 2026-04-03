/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Preview } from "@storybook/react-vite";
import "./tailwind.css";

const parameters: Preview["parameters"] = {
  controls: {
    matchers: {},
  },
};

const preview: Preview = {
  parameters,
  tags: ["autodocs"],
};
export default preview;
