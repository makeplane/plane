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

import { lazy } from "react";
// plane imports
import type { TProfileSettingsTabs } from "@plane/types";

export const PROFILE_SETTINGS_PAGES_MAP: Record<TProfileSettingsTabs, React.LazyExoticComponent<React.FC>> = {
  general: lazy(() => import("./general").then((m) => ({ default: m.GeneralProfileSettings }))),
  preferences: lazy(() => import("./preferences").then((m) => ({ default: m.PreferencesProfileSettings }))),
  notifications: lazy(() => import("./notifications").then((m) => ({ default: m.NotificationsProfileSettings }))),
  security: lazy(() => import("./security").then((m) => ({ default: m.SecurityProfileSettings }))),
  "api-tokens": lazy(() => import("./api-tokens").then((m) => ({ default: m.APITokensProfileSettings }))),
};
