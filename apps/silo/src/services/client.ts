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
import { ImportReportAPIService } from "@/services/job/import-job-report.service";
import { ImportJobAPIService } from "@/services/job/import-job.service";

// types
import { WorkspaceConnectionAPIService } from "@/services/workspace/connection.service";
import { WorkspaceCredentialAPIService } from "@/services/workspace/credential.service";
import { WorkspaceEntityConnectionAPIService } from "@/services/workspace/entity-connection.service";
import type { ClientOptions } from "@/types";
import { AssetApiService } from "./asset/asset.service";
import { PageAPIService } from "./page/page.service";
import { WorkItemPropertyAPIService } from "./work-item-property/work-item-property.service";
import { ReleaseAPIService } from "./release/release.service";
import { ImportExecutionLogAPIService } from "./job";

export class APIClient {
  options: ClientOptions;
  importJob: ImportJobAPIService;
  importReport: ImportReportAPIService;
  importExecutionLog: ImportExecutionLogAPIService;
  workspaceConnection: WorkspaceConnectionAPIService;
  workspaceCredential: WorkspaceCredentialAPIService;
  workspaceEntityConnection: WorkspaceEntityConnectionAPIService;
  // App level services
  page: PageAPIService;
  asset: AssetApiService;
  workItemProperty: WorkItemPropertyAPIService;
  release: ReleaseAPIService;

  constructor(options: ClientOptions) {
    this.options = options;
    this.workspaceConnection = new WorkspaceConnectionAPIService(options);
    this.workspaceCredential = new WorkspaceCredentialAPIService(options);
    this.workspaceEntityConnection = new WorkspaceEntityConnectionAPIService(options);
    this.importJob = new ImportJobAPIService(options);
    this.importReport = new ImportReportAPIService(options);
    this.importExecutionLog = new ImportExecutionLogAPIService(options);
    this.page = new PageAPIService(options);
    this.asset = new AssetApiService(options);
    this.workItemProperty = new WorkItemPropertyAPIService(options);
    this.release = new ReleaseAPIService(options);
  }
}

let apiClient: APIClient | null = null;

export const getAPIClient = (baseUrl?: string): APIClient => {
  if (!apiClient) {
    apiClient = new APIClient({
      baseURL: baseUrl || env.API_BASE_URL,
      hmacPrivateKey: env.SILO_HMAC_SECRET_KEY,
      serviceName: "SILO",
    });
  }
  return apiClient;
};

export const getAPIClientInternal = (): APIClient =>
  new APIClient({
    baseURL: env.API_INTERNAL_BASE_URL || env.API_BASE_URL,
    hmacPrivateKey: env.SILO_HMAC_SECRET_KEY,
    serviceName: "SILO",
  });
