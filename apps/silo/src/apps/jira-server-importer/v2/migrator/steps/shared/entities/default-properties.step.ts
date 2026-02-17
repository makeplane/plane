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

import { createSuccessContext } from "@/apps/jira-server-importer/v2/helpers/ctx";
import { extractJobData } from "@/apps/jira-server-importer/v2/helpers/job";
import { getSupportedDefaultProperties } from "@/apps/jira-server-importer/v2/helpers/properties";
import type { TIssueTypesData, TStepExecutionContext, TStepExecutionInput } from "@/apps/jira-server-importer/v2/types";
import { EJiraStep } from "@/apps/jira-server-importer/v2/types";
import { JiraIssuePropertiesStep } from "./issue-properties.step";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";

/*
 * @overview
 * There is a difference between a couple of crucial properties between jira
 * and plane, for example fixVersion, Version, Reporter etc. This step takes
 * the responsibility of creating those default properties for plane. Currently
 * the way to achieve is to create custom properties and all those custom properties
 * to all the available issue types, which will allow us to map those properties
 * to the corresponding plane properties.
 */
export class JiraDefaultPropertiesStep extends JiraIssuePropertiesStep {
  name: EJiraStep = EJiraStep.DEFAULT_PROPERTIES;
  dependencies: EJiraStep[] = [EJiraStep.ISSUE_TYPES];

  async execute(input: TStepExecutionInput): Promise<TStepExecutionContext> {
    // Get the issue types from the dependency data and for each issue type, populate
    // the default properties for that issue type, and create them in plane.
    const { dependencyData, jobContext, storage } = input;
    const { job } = jobContext;

    try {
      const issueTypes = dependencyData?.issue_types as TIssueTypesData;
      if (!issueTypes || issueTypes.length === 0) {
        throw new Error("No issue types found");
      }

      const { resourceId, projectId } = extractJobData(job);
      const defaultPropertiesToCreate = [];

      for (const issueType of issueTypes) {
        const defaultProperties = getSupportedDefaultProperties(
          resourceId,
          projectId,
          issueType.id,
          issueType.external_id,
          this.source
        );
        defaultPropertiesToCreate.push(...defaultProperties);
      }

      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: "DEFAULT_PROPERTIES",
        level: EExecutionLogLevel.INFO,
        metrics: {
          total: defaultPropertiesToCreate.length,
          pulled: defaultPropertiesToCreate.length,
        },
        additional_data: {
          issueTypesCount: issueTypes.length,
          propertyNames: new Set(defaultPropertiesToCreate.map((p) => p.display_name)),
        },
      });

      const pushed = await this.push(jobContext, defaultPropertiesToCreate, issueTypes);
      await this.storePropertiesData(EJiraStep.ISSUE_PROPERTIES, job, pushed, storage);

      return createSuccessContext({
        pulled: defaultPropertiesToCreate.length,
        pushed: defaultPropertiesToCreate.length,
        totalProcessed: defaultPropertiesToCreate.length,
      });
    } catch (error) {
      executionLog.collect(job.id, {
        entity_type: EExecutionLogEntityType.ISSUE_DEFAULT_PROPERTY,
        phase: "EXECUTE_DEFAULT_PROPERTIES",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        is_fatal: true,
      });

      throw error;
    }
  }
}
