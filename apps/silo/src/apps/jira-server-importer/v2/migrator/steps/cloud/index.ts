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

import { E_IMPORTER_KEYS } from "@plane/etl/core";
import {
  // Pre-run steps
  WorkspaceFeaturesStep,
  PlaneProjectCreateStep,
  PlaneProjectConfigurationStep,
  // Entity steps
  JiraBoardsStep,
  JiraResolutionsStep,
  JiraCyclesStep,
  JiraModulesStep,
  JiraReleasesStep,
  WaitForCeleryStep,
  // Association steps
  JiraToggleIssuePropertiesStep,
  JiraRelationsStep,
  JiraExecutionSummaryStep,
  CleanupIssueSequenceStep,
} from "../shared";
import {
  JiraCloudUserStep,
  JiraCloudIssuePropertiesStep,
  JiraCloudIssueTypesStep,
  JiraCloudStatesStep,
} from "./entities";
import { JiraCloudIssuesStep } from "./issues";

const JIRA_CLOUD_STEPS = [
  // Pre-run steps
  new WorkspaceFeaturesStep(),
  new PlaneProjectCreateStep(),
  new PlaneProjectConfigurationStep(),
  // Entity steps
  new JiraCloudUserStep(),
  new JiraReleasesStep(E_IMPORTER_KEYS.JIRA),
  new JiraCloudStatesStep(),
  new JiraResolutionsStep(),
  new JiraModulesStep(E_IMPORTER_KEYS.JIRA),
  new JiraBoardsStep(),
  new JiraCyclesStep(E_IMPORTER_KEYS.JIRA),
  new JiraCloudIssueTypesStep(E_IMPORTER_KEYS.JIRA),
  new JiraCloudIssuePropertiesStep(E_IMPORTER_KEYS.JIRA),
  // Issue steps
  new JiraCloudIssuesStep(E_IMPORTER_KEYS.JIRA),
  new WaitForCeleryStep(),
  // Association steps
  new JiraRelationsStep(E_IMPORTER_KEYS.JIRA),
  // Post Run Steps
  new CleanupIssueSequenceStep(),
  new JiraToggleIssuePropertiesStep(),
  new JiraExecutionSummaryStep(),
];

export default JIRA_CLOUD_STEPS;
