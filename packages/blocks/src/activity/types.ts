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

import type { ReactNode } from "react";

// --- Shared types used by multiple components ---

export type ActivityTab = {
  key: string;
  label: string;
};

export type ReactionChip = {
  emoji: ReactNode;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
};

export type ThreadSummary = {
  avatars: ReactNode[];
  replyCount: number;
  lastReplyTime: string;
};

export type CommentSource = {
  icon: ReactNode;
  label: string;
  url?: string;
};

export type PropertyValue = {
  icon?: ReactNode;
  label: string;
  isEmpty?: boolean;
};

export type ActivityItemData = {
  actor: ReactNode;
  timestamp: string;
  tooltipTimestamp?: string;
  icon?: ReactNode;
  customContent?: ReactNode;
};
