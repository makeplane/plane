/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class EraserService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  getConnection(workspaceSlug: string): Promise<{ connected: boolean }> {
    return this.get(`/api/workspaces/${workspaceSlug}/eraser/`).then((response) => response.data);
  }

  connect(workspaceSlug: string, apiToken: string): Promise<{ connected: boolean }> {
    return this.put(`/api/workspaces/${workspaceSlug}/eraser/`, { api_token: apiToken }).then(
      (response) => response.data
    );
  }

  disconnect(workspaceSlug: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/eraser/`).then(() => undefined);
  }

  getMetadata(workspaceSlug: string, url: string): Promise<{ title: string; url: string }> {
    return this.get(`/api/workspaces/${workspaceSlug}/eraser/metadata/`, { params: { url } }).then(
      (response) => response.data
    );
  }
}
