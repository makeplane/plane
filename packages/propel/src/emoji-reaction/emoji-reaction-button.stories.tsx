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
import { fn } from "storybook/test";
import { EmojiReactionButton } from "./emoji-reaction";

const meta = preview.meta({
  title: "Media/Emoji Reaction Button",
  component: EmojiReactionButton,
  parameters: {
    layout: "centered",
  },
  args: {
    onAddReaction: fn(),
  },
});

export const Default = meta.story({});
