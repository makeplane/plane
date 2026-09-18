/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LucideIcon } from "lucide-react";
import { VIEW_ACCESS_SPECIFIERS as VIEW_ACCESS_SPECIFIERS_CONSTANTS } from "@plane/constants";
import { GlobeOutline, LockOutline } from "@makeplane/propel/icons";

import type { ISvgIcons } from "@plane/propel/icons";
import { EViewAccess } from "@plane/types";

const VIEW_ACCESS_ICONS = {
  [EViewAccess.PUBLIC]: GlobeOutline,
  [EViewAccess.PRIVATE]: LockOutline,
};

export const VIEW_ACCESS_SPECIFIERS: {
  key: EViewAccess;
  i18n_label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
}[] = VIEW_ACCESS_SPECIFIERS_CONSTANTS.map((option) => ({
  ...option,
  icon: VIEW_ACCESS_ICONS[option.key as keyof typeof VIEW_ACCESS_ICONS],
}));
