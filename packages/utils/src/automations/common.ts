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

// plane imports
import { joinUrlPath } from "../string";

// ------------ Settings path ------------

type ProjectAutomationSettingsPathProps = {
  workspaceSlug: string;
  projectId: string;
};

/**
 * Gets the base path for the automation settings page
 * @params workspaceSlug - The slug of the workspace
 * @params projectId - The ID of the project
 * @returns The base path for the automation settings page
 */
export const getProjectAutomationSettingsPath = (props: ProjectAutomationSettingsPathProps) =>
  joinUrlPath(props.workspaceSlug, "settings", "projects", props.projectId, "automations");

type WorkspaceAutomationSettingsPathProps = {
  workspaceSlug: string;
};

/**
 * Gets the base path for the workspace automation settings page
 * @params workspaceSlug - The slug of the workspace
 * @returns The base path for the workspace automation settings page
 */
export const getWorkspaceAutomationSettingsPath = (props: WorkspaceAutomationSettingsPathProps) =>
  joinUrlPath(props.workspaceSlug, "settings", "automations");
