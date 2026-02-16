/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { makeObservable } from "mobx";
// types
import type { IBasePowerKStore } from "@/store/base-power-k.store";
import { BasePowerKStore } from "@/store/base-power-k.store";

export type IPowerKStore = IBasePowerKStore;

export class PowerKStore extends BasePowerKStore implements IPowerKStore {
  constructor() {
    super();
    makeObservable(this, {});
  }
}
