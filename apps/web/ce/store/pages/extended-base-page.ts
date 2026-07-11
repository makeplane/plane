/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TPage, TPageExtended } from "@plane/types";
import type { RootStore } from "@/plane-web/store/root.store";
import type { TBasePageServices } from "@/store/pages/base-page";

export type TExtendedPageInstance = TPageExtended & {
  asJSONExtended: TPageExtended;
};

export class ExtendedBasePage implements TExtendedPageInstance {
  // The body is intentionally empty: this is the community-edition stub, and the constructor
  // exists to define the signature that `BasePage`'s `super(store, page, services)` call and the
  // enterprise variant both rely on. Deleting it as a "useless constructor" breaks the subclass.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-useless-constructor
  constructor(store: RootStore, page: TPage, services: TBasePageServices) {}

  get asJSONExtended(): TExtendedPageInstance["asJSONExtended"] {
    return {};
  }
}
