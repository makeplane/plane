/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: app endpoints of web push notifications (apps/api/plane/liviere/app/push.py).

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TPushProject = { id: string; identifier: string; name: string; selected: boolean };

export type TPushSettings = {
  available: boolean;
  public_key: string | null;
  workspaces: { slug: string; name: string; projects: TPushProject[] }[];
};

const URL = "/api/users/me/liviere/push/";

export class PushService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private unwrap<T>(request: Promise<{ data: T }>): Promise<T> {
    return request
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async settings(): Promise<TPushSettings> {
    return this.unwrap(this.get(URL));
  }

  async setProjects(projectIds: string[]): Promise<{ project_ids: string[] }> {
    return this.unwrap(this.put(`${URL}projects/`, { project_ids: projectIds }));
  }

  async subscribe(subscription: PushSubscriptionJSON): Promise<void> {
    await this.unwrap(
      this.post(`${URL}subscriptions/`, {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        user_agent: navigator.userAgent.slice(0, 255),
      })
    );
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.unwrap(this.delete(`${URL}subscriptions/`, { endpoint }));
  }

  async sendTest(): Promise<void> {
    await this.unwrap(this.post(`${URL}test/`));
  }
}

export const pushService = new PushService();
