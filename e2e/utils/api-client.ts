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

import type { APIRequestContext } from "@playwright/test";

const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

/**
 * Direct API client for test setup/teardown.
 * Use this to create test data via the API instead of through the UI.
 */
export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async signIn(email: string, password: string): Promise<unknown> {
    const response = await this.request.post(`${API_BASE_URL}/api/sign-in/`, {
      data: { email, password, medium: "email" },
    });
    return response.json();
  }

  async createWorkspace(name: string, slug: string): Promise<unknown> {
    const response = await this.request.post(`${API_BASE_URL}/api/v1/workspaces/`, {
      data: { name, slug },
    });
    return response.json();
  }

  async createProject(workspaceSlug: string, name: string, identifier: string): Promise<unknown> {
    const response = await this.request.post(`${API_BASE_URL}/api/v1/workspaces/${workspaceSlug}/projects/`, {
      data: { name, identifier, network: 2 },
    });
    return response.json();
  }

  async createIssue(
    workspaceSlug: string,
    projectId: string,
    data: { name: string; [key: string]: unknown }
  ): Promise<unknown> {
    const response = await this.request.post(
      `${API_BASE_URL}/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/`,
      { data }
    );
    return response.json();
  }
}
