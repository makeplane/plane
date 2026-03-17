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

import type ElectronStore from "electron-store";
import type { StoreSchema } from "./types";

export const STORE_SCHEMA_VERSION = 1;

export type StoreMigration = {
  from: number;
  to: number;
  migrate: (store: ElectronStore<StoreSchema>) => void;
};

// Future migrations can be added here.
export const STORE_MIGRATIONS: StoreMigration[] = [];
