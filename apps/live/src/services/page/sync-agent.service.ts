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

// plane imports
import type { TDocumentPayload } from "@plane/types";
import { env } from "@/env";
import { AppError } from "@/lib/errors";
import { PageService } from "./extended.service";

export class SyncAgentPageService extends PageService {
  protected basePath: string;

  constructor() {
    super();
    // validate cookie
    if (!env.LIVE_SERVER_SECRET_KEY) throw new AppError("live server secret key is required.");
    // set secret key
    this.setHeader("live-server-secret-key", env.LIVE_SERVER_SECRET_KEY);
    // set base path
    this.basePath = `/api`;
  }

  async updateDescriptionBinary(pageId: string, data: TDocumentPayload): Promise<any> {
    // no op
    // since we can't prevent hocuspocus from updating the description after a
    // sync event, we need to manually override the method to not do anything
  }
}
