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

import { PlaneClient } from "@makeplane/plane-node-sdk";
import { env } from "@/env";

export const getPlaneClientV2 = ({ accessToken, apiKey }: { accessToken?: string; apiKey?: string }): PlaneClient => {
  const baseUrl = env.API_INTERNAL_BASE_URL || env.API_BASE_URL;
  if (!accessToken && !apiKey) {
    throw new Error("No access token or api key provided");
  }

  if (accessToken) {
    return new PlaneClient({
      baseUrl,
      accessToken,
    });
  }
  return new PlaneClient({
    baseUrl,
    apiKey,
  });
};
