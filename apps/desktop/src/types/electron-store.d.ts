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

// Type augmentation for electron-store
// This fixes pnpm's module resolution not properly resolving the Conf base class
declare module "electron-store" {
  export interface Options<T> {
    defaults?: T;
    name?: string;
  }

  export default class ElectronStore<T = Record<string, unknown>> {
    constructor(options?: Options<T>);
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    delete<K extends keyof T>(key: K): void;
    clear(): void;
    has<K extends keyof T>(key: K): boolean;
    readonly path: string;
    readonly store: T;
  }
}
