/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { mutate } from "swr";
// store
import { BaseWorkspaceRootStore } from "@/store/workspace";
import type { RootStore } from "@/plane-web/store/root.store";

export class WorkspaceRootStore extends BaseWorkspaceRootStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);
  }

  // actions
  /**
   * Mutate workspace members activity
   * @param workspaceSlug
   */
  mutateWorkspaceMembersActivity = async (workspaceSlug: string) => {
    // revalidate every SWR key holding workspace activity pages for this workspace
    const workspaceActivityKeyPrefix = `WORKSPACE_ACTIVITY_${workspaceSlug.toUpperCase()}_`;
    await mutate((key) => typeof key === "string" && key.startsWith(workspaceActivityKeyPrefix));
  };
}
