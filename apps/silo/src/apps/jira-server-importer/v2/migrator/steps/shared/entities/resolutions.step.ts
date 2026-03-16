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
import { createEmptyContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import type { IStep, TStepExecutionContext, TStepExecutionInput } from "@/apps/jira-server-importer/v2/types";

export class JiraResolutionsStep implements IStep {
  name = EJiraStep.RESOLUTIONS;
  dependencies: EJiraStep[] = [];

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    const { jobContext, storage } = input;
    const { job, sourceClient } = jobContext;

    const resolutions = await sourceClient.getAllResolutions();
    await storage.storeData(job.id, this.name, resolutions, ["id"]);
    return createEmptyContext();
  }
}
