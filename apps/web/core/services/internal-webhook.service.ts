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

import { API_BASE_URL } from "@plane/constants";
import type { IWebhook } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class InternalWebhookService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description get or create the internal webhook url
   * @param { string } workspaceSlug
   * @param { Partial<IWebhook> } payload
   * @returns { Promise<{ is_connected: boolean } | undefined> }
   */
  async getOrCreateInternalWebhook(
    workspaceSlug: string,
    payload: Partial<IWebhook>
  ): Promise<{ is_connected: boolean; id: string } | undefined> {
    return this.post(`/api/workspaces/${workspaceSlug}/internal-webhooks/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  /**
   * @description delete the internal webhook url
   * @param { string } workspaceSlug
   * @param { string } id
   * @returns { Promise<void> }
   */
  async deleteInternalWebhook(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/internal-webhooks/${id}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export const internalWebhookService = new InternalWebhookService();

export default internalWebhookService;
