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

import { env } from "@/env";
import { E_INTEGRATION_KEYS } from "@plane/types";

export const getAppOAuthCallbackUrl = (provider: string) =>
  `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/apps/${provider}/auth/callback`;

export const getCallbackSuccessUrl = (workspaceSlug: string, appName: string) => {
  if (appName.toLowerCase() === E_INTEGRATION_KEYS.RUNNER.toLowerCase()) {
    return `${env.APP_BASE_URL}/${workspaceSlug}/settings/runner/`;
  }
  return `${env.APP_BASE_URL}/${workspaceSlug}/settings/integrations`;
};
