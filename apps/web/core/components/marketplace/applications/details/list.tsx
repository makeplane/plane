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

import React from "react";
import type { TUserApplication } from "@plane/types";
import { AppTile } from "@/components/marketplace";

// list all the applications
// have tabs to filter by category
// have search bar to search by name

type AppListProps = {
  apps: TUserApplication[];
};

export function AppList(props: AppListProps) {
  const { apps } = props;

  return apps.map((app) => <AppTile key={app.id} app={app} />);
}
