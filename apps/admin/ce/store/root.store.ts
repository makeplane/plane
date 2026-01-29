/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { enableStaticRendering } from "mobx-react";
// stores
import { CoreRootStore } from "@/store/root.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore extends CoreRootStore {
  constructor() {
    super();
  }

  hydrate(initialData: any) {
    super.hydrate(initialData);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
  }
}
