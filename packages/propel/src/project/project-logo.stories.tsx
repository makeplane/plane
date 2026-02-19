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
import { ProjectLogo } from "./project-logo";

const meta = preview.meta({
  component: ProjectLogo,
  parameters: {
    layout: "centered",
  },
});

export const WithIcon = meta.story({
  args: {
    logo: {
      in_use: "icon",
      icon: {
        name: "rocket_launch",
        color: "#3b82f6",
      },
    },
  },
});

export const WithEmoji = meta.story({
  args: {
    logo: {
      in_use: "emoji",
      emoji: {
        value: "128640",
      },
    },
  },
});

export const FallbackEmpty = meta.story({
  args: {
    logo: {
      in_use: "icon",
    },
  },
});
