/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable } from "mobx";
import type { TPage, TPageExtended } from "@plane/types";
import type { CoreRootStore } from "@/store/root.store";
import type { TBasePageServices } from "@/store/pages/base-page";

export type TExtendedPageInstance = TPageExtended & {
  asJSONExtended: TPageExtended;
  // Liviere/plane fork: "Block API changes" (page menu), see core/liviere
  isApiChangesBlocked: boolean;
  setApiChangesBlocked: (blocked: boolean) => void;
};

export class ExtendedBasePage implements TExtendedPageInstance {
  isApiChangesBlocked: boolean;

  // oxlint-disable-next-line no-unused-vars
  constructor(store: CoreRootStore, page: TPage, services: TBasePageServices) {
    this.isApiChangesBlocked = Boolean(page?.view_props?.liviere_block_api);

    makeObservable(this, {
      isApiChangesBlocked: observable.ref,
      setApiChangesBlocked: action,
    });
  }

  get asJSONExtended(): TExtendedPageInstance["asJSONExtended"] {
    return {};
  }

  setApiChangesBlocked = (blocked: boolean) => {
    this.isApiChangesBlocked = blocked;
  };
}
