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

import type { WorkspacePreferencesStoreType } from "./workspace.store";
import { WorkspacePreferencesStore } from "./workspace.store";

export interface PreferencesRootStoreType {
  workspace: WorkspacePreferencesStoreType;
}

export class PreferencesRootStore implements PreferencesRootStoreType {
  workspace: WorkspacePreferencesStoreType;

  constructor() {
    this.workspace = new WorkspacePreferencesStore();
  }
}

export type { WorkspacePreferencesStoreType } from "./workspace.store";
