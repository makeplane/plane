/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { clone } from "lodash-es";
import type { TIssue, TWorkItemRealtimeEvent } from "@plane/types";
import type { IIssueRootStore } from "./root.store";
import type { IBaseIssuesStore } from "./helpers/base-issues.store";

const isStaleIssueUpdate = (existing: TIssue | undefined, incoming: TIssue) => {
  if (!existing?.updated_at || !incoming.updated_at) return false;
  return existing.updated_at > incoming.updated_at;
};

const shouldAppearOnStore = (store: IBaseIssuesStore, issue: TIssue, root: IIssueRootStore) => {
  if (store === root.moduleIssues) {
    if (!root.moduleId) return false;
    return Boolean(issue.module_ids?.includes(root.moduleId));
  }
  if (store === root.cycleIssues) {
    if (!root.cycleId) return false;
    return issue.cycle_id === root.cycleId;
  }
  if (root.projectId && issue.project_id && issue.project_id !== root.projectId) {
    return false;
  }
  return true;
};

export const applyWorkItemRealtimeEvent = (root: IIssueRootStore, event: TWorkItemRealtimeEvent) => {
  if (!event.issue_id) return;
  if (event.actor_id && root.currentUserId && event.actor_id === root.currentUserId) return;

  const listStores: IBaseIssuesStore[] = [
    root.projectIssues,
    root.moduleIssues,
    root.cycleIssues,
    root.projectViewIssues,
  ];
  const existing = clone(root.issues.getIssueById(event.issue_id));

  if (event.type === "issue.deleted") {
    listStores.forEach((store) => {
      if (store.groupedIssueIds) store.removeIssueFromList(event.issue_id);
    });
    root.issues.removeIssue(event.issue_id);
    return;
  }

  const issue = event.issue;
  if (!issue?.id) return;
  if (isStaleIssueUpdate(existing, issue)) return;

  root.issues.addIssue([issue]);

  listStores.forEach((store) => {
    if (!store.groupedIssueIds) return;
    const shouldAppear = shouldAppearOnStore(store, issue, root);
    const wasVisible = Boolean(existing && shouldAppearOnStore(store, existing, root));

    if (shouldAppear && !wasVisible) {
      store.addIssueToList(issue.id);
      return;
    }
    if (!shouldAppear && wasVisible) {
      store.removeIssueFromList(issue.id);
      return;
    }
    if (shouldAppear && wasVisible) {
      store.updateIssueList(issue, existing);
    }
  });
};
