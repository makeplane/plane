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

import { JiraIssueDataExtractor } from "../../../shared/issues/extractors/data.extractor";
import type { JiraSprintExtractor } from "../../../shared/issues/extractors/sprint.extractor";
import { JiraCloudSprintExtractor } from "./sprint.extractor";

export class JiraCloudDataExtractor extends JiraIssueDataExtractor {
  protected getSprintExtractor(projectId: string, resourceId: string): JiraSprintExtractor {
    return new JiraCloudSprintExtractor(projectId, resourceId);
  }
}
