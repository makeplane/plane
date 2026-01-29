/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { store } from "@/lib/store-context";

export const getIsWorkspaceCreationDisabled = () => {
  const instanceConfig = store.instance.config;

  return instanceConfig?.is_workspace_creation_disabled;
};
