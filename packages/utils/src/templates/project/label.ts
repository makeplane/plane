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

import { v4 as uuidv4 } from "uuid";
// plane imports
import type { IIssueLabel } from "@plane/types";

/**
 * Mock create or update label
 * @param workspaceSlug - The workspace slug
 * @param projectId - The project id
 * @param data - The label data
 * @returns The label
 */
export const mockCreateOrUpdateLabel = async (
  workspaceSlug: string,
  projectId: string,
  data: Partial<IIssueLabel>
): Promise<IIssueLabel> =>
  Promise.resolve({
    id: data.id ?? uuidv4(),
    name: data.name ?? "",
    color: data.color ?? "",
    project_id: projectId,
    workspace_id: workspaceSlug,
    parent: data.parent ?? null,
    sort_order: data.sort_order ?? Math.floor(Math.random() * 65535),
    created_by: data.created_by ?? null,
  });
