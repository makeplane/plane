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
  CleanupIssueSequenceStep,
  JiraBoardsStep,
  JiraCyclesStep,
  JiraExecutionSummaryStep,
  JiraIssuePropertiesStep,
  JiraIssuesStep,
  JiraIssueTypesStep,
  JiraModulesStep,
  JiraRelationsStep,
  JiraToggleIssuePropertiesStep,
  JiraUsersStep,
  PlaneProjectConfigurationStep,
  WaitForCeleryStep,
  JiraStatesStep,
  PlaneProjectCreateStep,
} from "../shared";
import { JiraResolutionsStep } from "../shared/entities/resolutions.step";
import { JiraReleasesStep } from "../shared/entities/releases.step";

const JIRA_SERVER_STEPS = [
  // Pre-run steps
  new PlaneProjectCreateStep(),
  new PlaneProjectConfigurationStep(),
  // Entity steps
  new JiraUsersStep(),
  new JiraReleasesStep(E_IMPORTER_KEYS.JIRA_SERVER),
  new JiraStatesStep(),
  new JiraResolutionsStep(),
  new JiraModulesStep(E_IMPORTER_KEYS.JIRA_SERVER),
  new JiraBoardsStep(),
  new JiraCyclesStep(E_IMPORTER_KEYS.JIRA_SERVER),
  new JiraIssueTypesStep(E_IMPORTER_KEYS.JIRA_SERVER),
  new JiraIssuePropertiesStep(E_IMPORTER_KEYS.JIRA_SERVER),
  // Issue steps
  new JiraIssuesStep(E_IMPORTER_KEYS.JIRA_SERVER),
  new WaitForCeleryStep(),
  // Association steps
  new JiraRelationsStep(E_IMPORTER_KEYS.JIRA_SERVER),
  // Post Run Steps
  new CleanupIssueSequenceStep(),
  new JiraToggleIssuePropertiesStep(),
  new JiraExecutionSummaryStep(),
];

export default JIRA_SERVER_STEPS;
