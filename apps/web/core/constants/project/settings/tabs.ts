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

// plane types
import { EUserPermissions, PROJECT_SETTINGS } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";

export const PROJECT_SETTINGS_LINKS: {
  key: string;
  i18n_label: string;
  href: string;
  access: EUserPermissions[] | EUserProjectRoles[];
  highlight: (pathname: string, baseUrl: string) => boolean;
}[] = [PROJECT_SETTINGS["project_updates"], PROJECT_SETTINGS["recurring_work_items"]];
