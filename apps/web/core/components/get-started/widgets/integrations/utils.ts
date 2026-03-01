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

import type { FC } from "react";
import type { ISvgIcons } from "@plane/propel/icons";
import { CommandIcon, CommentReplyIcon, DiscordIcon, PageIcon, UserPropertyIcon } from "@plane/propel/icons";

export type TUsefulLink = {
  readonly title: string;
  readonly icon: FC<ISvgIcons>;
  readonly action: () => void;
  readonly shouldRender?: boolean;
};

type CreateUsefulLinksParams = {
  readonly openChatSupport: () => void;
  readonly isChatSupportEnabled: boolean;
  readonly toggleShortcutsListModal: (open: boolean) => void;
};

export function createUsefulLinks({
  openChatSupport,
  isChatSupportEnabled,
  toggleShortcutsListModal,
}: CreateUsefulLinksParams): TUsefulLink[] {
  return [
    {
      title: "Documentation",
      icon: PageIcon,
      action: () => window.open("https://go.plane.so/p-docs", "_blank", "noopener,noreferrer"),
    },
    {
      title: "Contact Sales",
      icon: UserPropertyIcon,
      action: () => window.open("mailto:sales@plane.so", "_blank", "noopener,noreferrer"),
    },
    {
      title: "Message Support",
      icon: CommentReplyIcon,
      action: openChatSupport,
      shouldRender: isChatSupportEnabled,
    },
    {
      title: "Keyboard Shortcuts",
      icon: CommandIcon,
      action: () => toggleShortcutsListModal(true),
    },
    {
      title: "Join Discord community",
      icon: DiscordIcon,
      action: () => window.open("https://go.plane.so/p-discord", "_blank", "noopener,noreferrer"),
    },
  ];
}
