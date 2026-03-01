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

// helpers
import { API_BASE_URL } from "@plane/constants";
import type { TUserApplication, TWorkspaceAppInstallation } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class ApplicationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getApplications(workspaceSlug: string): Promise<TUserApplication[] | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/applications/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getApplication(workspaceSlug: string, appSlug: string): Promise<TUserApplication | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/applications/${appSlug}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createApplication(workspaceSlug: string, data: Partial<TUserApplication>): Promise<TUserApplication> {
    return this.post(`/api/workspaces/${workspaceSlug}/applications/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateApplication(
    workspaceSlug: string,
    appSlug: string,
    data: Partial<TUserApplication>
  ): Promise<TUserApplication> {
    return this.patch(`/api/workspaces/${workspaceSlug}/applications/${appSlug}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteApplication(workspaceSlug: string, appSlug: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/applications/${appSlug}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async revokeApplicationAccess(workspaceSlug: string, applicationId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/app-installations/${applicationId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async regenerateApplicationSecret(workspaceSlug: string, applicationId: string): Promise<TUserApplication> {
    return this.patch(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/regenerate-secret/`, {})
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async checkApplicationSlug(workspaceSlug: string, slug: string): Promise<any> {
    console.log("slug", slug);
    return this.post(`/api/workspaces/${workspaceSlug}/applications/validations/check-slug/`, { app_slug: slug })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async installApplication(workspaceSlug: string, applicationId: string): Promise<TWorkspaceAppInstallation> {
    return this.post(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/install/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async publishApplication(workspaceSlug: string, applicationId: string): Promise<TWorkspaceAppInstallation> {
    return this.post(`/api/workspaces/${workspaceSlug}/applications/${applicationId}/publish/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getApplicationByClientId(clientId: string): Promise<Partial<TUserApplication> | undefined> {
    return this.get(`/api/applications/${clientId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getPublishedApplicationBySlug(workspaceSlug: string, appSlug: string): Promise<TUserApplication | undefined> {
    return this.get(`/api/workspaces/${workspaceSlug}/published-applications/${appSlug}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getApplicationPermissions(
    applicationId: string
  ): Promise<{ workspace_id: string; state: string; is_installed: boolean }[] | undefined> {
    return this.get(`/api/workspaces-check-app-installation-allowed/${applicationId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getSupportedWorkspaceIds(clientId: string): Promise<string[] | undefined> {
    return this.get(`/api/applications/${clientId}/supported-workspaces/`)
      .then((res) => res?.data?.workspace_ids)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
