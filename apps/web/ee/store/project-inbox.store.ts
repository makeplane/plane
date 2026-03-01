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

import { set } from "lodash-es";
import { makeObservable, observable, runInAction } from "mobx";
import type { TInboxForm } from "@plane/types";
import type { IProjectInboxStore as CeIProjectInboxStore } from "@/store/inbox/project-inbox.store";
import { ProjectInboxStore as CeProjectInboxStore } from "@/store/inbox/project-inbox.store";
import type { CoreRootStore } from "@/store/root.store";
import { InboxIssueService } from "../../core/services/inbox-issue.service";

export interface IProjectInboxStore extends CeIProjectInboxStore {
  intakeForms: Record<string, TInboxForm>;

  fetchIntakeForms: (workspaceSlug: string, projectId: string) => Promise<void>;
  toggleIntakeForms: (workspaceSlug: string, projectId: string, data: Partial<TInboxForm>) => Promise<void>;
  regenerateIntakeForms: (workspaceSlug: string, projectId: string, featureType: string) => Promise<void>;
}

export class ProjectInboxStore extends CeProjectInboxStore implements IProjectInboxStore {
  intakeForms: Record<string, TInboxForm> = {};

  //services
  inboxIssueService;

  constructor(private rootStore: CoreRootStore) {
    super(rootStore);
    makeObservable(this, {
      //observables
      intakeForms: observable,
    });

    //services
    this.inboxIssueService = new InboxIssueService();
  }

  fetchIntakeForms = async (workspaceSlug: string, projectId: string) => {
    try {
      const intakeForms = await this.inboxIssueService.retrievePublishForm(workspaceSlug, projectId);
      if (intakeForms)
        runInAction(() => {
          set(this.intakeForms, projectId, intakeForms);
        });
    } catch {
      console.error("Error fetching the publish forms");
    }
  };

  toggleIntakeForms = async (workspaceSlug: string, projectId: string, data: Partial<TInboxForm>) => {
    const initialData = { ...this.intakeForms[projectId] };
    try {
      runInAction(() => {
        set(this.intakeForms, projectId, { ...initialData, ...data });
      });
      const result = await this.inboxIssueService.updatePublishForm(workspaceSlug, projectId, data);
      runInAction(() => {
        set(this.intakeForms, [projectId, "anchors"], result.anchors);
      });
    } catch {
      console.error("Error fetching the publish forms");
      runInAction(() => {
        set(this.intakeForms, projectId, initialData);
      });
    }
  };
  regenerateIntakeForms = async (workspaceSlug: string, projectId: string, featureType: string) => {
    try {
      const result = await this.inboxIssueService.regeneratePublishForm(workspaceSlug, projectId, featureType);
      if (result) {
        runInAction(() => {
          set(this.intakeForms, projectId, {
            ...this.intakeForms[projectId],
            anchors: {
              ...this.intakeForms[projectId].anchors,
              [featureType]: result?.anchor,
            },
          });
        });
      }
    } catch {
      console.error("Error fetching the publish forms");
    }
  };
}
