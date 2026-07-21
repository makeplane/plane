/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { autorun } from "mobx";
import type { RootStore } from "@/store/root.store";
import type { IBaseTimelineStore } from "@/store/timeline/base-timeline.store";
import { BaseTimeLineStore } from "@/store/timeline/base-timeline.store";

export interface IIssuesTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class IssuesTimeLineStore extends BaseTimeLineStore implements IIssuesTimeLineStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);

    autorun(() => {
      const getIssueById = this.rootStore.issue.issues.getIssueById;
      this.updateBlocks(getIssueById);
    });
  }
}
