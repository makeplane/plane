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

import { logger } from "@plane/logger";
import type { PlaneWebhookPayload } from "@plane/sdk";

export const handleIssueWebhook = (data: PlaneWebhookPayload) => {
  logger.info("[BITBUCKET][PLANE] Issue webhook received. No Bitbucket issue-tracker sync is required, skipping.", {
    workspace: data.workspace,
    project: data.project,
    issue: data.issue,
  });
};
