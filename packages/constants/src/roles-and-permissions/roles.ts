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
import type { PermissionNamespace } from "@plane/types";

export const SETTINGS_ROLES_LIST: {
  key: PermissionNamespace;
  i18n_label: string;
}[] = [
  {
    key: "workspace",
    i18n_label: "workspace_settings.settings.roles_and_permissions.roles_list.workspace.label",
  },
  {
    key: "project",
    i18n_label: "workspace_settings.settings.roles_and_permissions.roles_list.project.label",
  },
];
