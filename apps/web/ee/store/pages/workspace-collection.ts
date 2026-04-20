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

import { computed, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
import type { TCollection } from "@plane/types";
import { CollectionService } from "@plane/services";
import type { RootStore } from "@/plane-web/store/root.store";
import type { TCollectionInstance } from "@/store/collections/base-collection";
import { BaseCollection } from "@/store/collections/base-collection";

const collectionService = new CollectionService();

export type TWorkspaceCollection = TCollectionInstance & {
  canCurrentUserEditCollection: boolean;
  canCurrentUserDeleteCollection: boolean;
  canCurrentUserChangeAccess: boolean;
  getRedirectionLink: () => string;
};

export class WorkspaceCollection extends BaseCollection implements TWorkspaceCollection {
  constructor(store: RootStore, collection: TCollection) {
    const { workspaceSlug } = store.router;

    super(store, collection, {
      update: async (payload) => {
        if (!workspaceSlug || !collection.id) throw new Error("Missing required fields.");
        return collectionService.update(workspaceSlug, collection.id, payload);
      },
    });

    makeObservable(this, {
      canCurrentUserEditCollection: computed,
      canCurrentUserDeleteCollection: computed,
      canCurrentUserChangeAccess: computed,
    });
  }

  get canCurrentUserEditCollection() {
    if (this.isCurrentUserOwner) return true;
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "wiki_collection",
      action: "edit",
      workspaceSlug,
      resourceMeta: { resourceId: this.id },
    });
  }

  get canCurrentUserDeleteCollection() {
    if (this.is_default) return false;
    if (this.isCurrentUserOwner) return true;
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return false;
    return this.rootStore.permissionAccessStore.can({
      resource: "wiki_collection",
      action: "delete",
      workspaceSlug,
      resourceMeta: { resourceId: this.id },
    });
  }

  get canCurrentUserChangeAccess() {
    if (this.is_default) return false;
    return this.canCurrentUserEditCollection;
  }

  getRedirectionLink = computedFn(() => {
    const { workspaceSlug } = this.rootStore.router;
    return `/${workspaceSlug}/wiki/collections/${this.id}`;
  });
}
