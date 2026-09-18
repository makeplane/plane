/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TPage, TPageExtended } from "@plane/types";
import type { CoreRootStore } from "@/store/root.store";
import type { TBasePageServices } from "@/store/pages/base-page";

export type TExtendedPageInstance = TPageExtended & {
  asJSONExtended: TPageExtended;
};

export class ExtendedBasePage implements TExtendedPageInstance {
  // oxlint-disable-next-line no-useless-constructor, no-unused-vars
  constructor(store: CoreRootStore, page: TPage, services: TBasePageServices) {}

  get asJSONExtended(): TExtendedPageInstance["asJSONExtended"] {
    return {};
  }
}
