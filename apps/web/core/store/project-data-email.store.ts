/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable } from "mobx";
// services
import { ProjectDataEmailService } from "@/services/project";
// store
import type { CoreRootStore } from "./root.store";

export interface IProjectDataEmailStore {
  sendCustomFieldDataEmail: (
    workspaceSlug: string,
    projectId: string,
    recipientIds: string[]
  ) => Promise<{ queued: number }>;
}

// Deliberately its own store rather than living on ProjectCustomFieldStore: sending
// this data by email is a distinct, stateless concern (it mutates nothing observable)
// from the field/value/option CRUD state that store owns.
export class ProjectDataEmailStore implements IProjectDataEmailStore {
  // root store
  rootStore;
  // services
  projectDataEmailService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      sendCustomFieldDataEmail: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.projectDataEmailService = new ProjectDataEmailService();
  }

  /**
   * Emails a project's current custom field data to the given project members
   */
  sendCustomFieldDataEmail = async (workspaceSlug: string, projectId: string, recipientIds: string[]) =>
    await this.projectDataEmailService.sendCustomFieldDataEmail(workspaceSlug, projectId, recipientIds);
}
