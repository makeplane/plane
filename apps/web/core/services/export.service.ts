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

/* eslint-disable no-useless-catch */
import { API_BASE_URL } from "@plane/constants";
import type { TWorkItemFilterExpression } from "@plane/types";
import { APIService } from "@/services/api.service";

export type TExportProvider = "csv" | "xlsx" | "json";

export class ExportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async exportWorkItems(
    workspaceSlug: string,
    projectId: string,
    provider: TExportProvider,
    rich_filters?: TWorkItemFilterExpression | null
  ): Promise<void> {
    try {
      await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/export/`, {
        provider,
        rich_filters,
      });
    } catch (error) {
      throw error;
    }
  }

  async exportCycleWorkItems(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    provider: TExportProvider,
    rich_filters?: TWorkItemFilterExpression | null
  ): Promise<void> {
    try {
      await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/export/`, {
        provider,
        rich_filters,
      });
    } catch (error) {
      throw error;
    }
  }

  async exportModuleWorkItems(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    provider: TExportProvider,
    rich_filters?: TWorkItemFilterExpression | null
  ): Promise<void> {
    try {
      await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/export/`, {
        provider,
        rich_filters,
      });
    } catch (error) {
      throw error;
    }
  }

  async exportProjectViewWorkItems(
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    provider: TExportProvider,
    rich_filters?: TWorkItemFilterExpression | null
  ): Promise<void> {
    try {
      await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/export/`, {
        provider,
        rich_filters,
      });
    } catch (error) {
      throw error;
    }
  }

  async exportWorkspaceViewWorkItems(
    workspaceSlug: string,
    viewId: string,
    provider: TExportProvider,
    rich_filters?: TWorkItemFilterExpression | null
  ): Promise<void> {
    try {
      await this.post(`/api/workspaces/${workspaceSlug}/views/${viewId}/export/`, {
        provider,
        rich_filters,
      });
    } catch (error) {
      throw error;
    }
  }

  async exportIntakeWorkItems(
    workspaceSlug: string,
    projectId: string,
    provider: TExportProvider,
    rich_filters?: TWorkItemFilterExpression | null
  ): Promise<void> {
    try {
      await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intakes/export/`, {
        provider,
        rich_filters,
      });
    } catch (error) {
      throw error;
    }
  }

  async exportEpics(
    workspaceSlug: string,
    projectId: string,
    provider: TExportProvider,
    rich_filters?: TWorkItemFilterExpression | null
  ): Promise<void> {
    try {
      await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/export/`, {
        provider,
        rich_filters,
      });
    } catch (error) {
      throw error;
    }
  }
}

const exportService = new ExportService();

export default exportService;
