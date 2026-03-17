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

import ElectronStore from "electron-store";
import { Store } from "./store";
import type { StoreSchema } from "./types";

export interface InstanceState {
  instanceUrl: string | undefined;
}

export class InstanceStore extends Store<InstanceState> {
  private persistStore: ElectronStore<StoreSchema>;

  constructor(persistStore: ElectronStore<StoreSchema>) {
    super({
      instanceUrl: persistStore.get("instanceUrl"),
    });
    this.persistStore = persistStore;
  }

  /**
   * Normalizes a URL to its origin (scheme + host + port).
   * Returns undefined if the URL is invalid.
   */
  #normalizeUrl(url: string): string | undefined {
    try {
      return new URL(url).origin;
    } catch {
      return undefined;
    }
  }

  setInstanceUrl(url: string | undefined): boolean {
    if (url === undefined) {
      if (this.state.instanceUrl === undefined) {
        return false;
      }

      this.persistStore.delete("instanceUrl");
      this.state = { instanceUrl: undefined };
      return true;
    }

    // Validate and normalize the new URL
    const normalizedUrl = url ? this.#normalizeUrl(url) : undefined;
    if (normalizedUrl === undefined) {
      return false;
    }

    // Normalize current URL for comparison
    const normalizedCurrentUrl = this.state.instanceUrl ? this.#normalizeUrl(this.state.instanceUrl) : undefined;

    // No change - return false to indicate no update needed
    if (normalizedUrl === normalizedCurrentUrl) {
      return false;
    }

    this.persistStore.set("instanceUrl", normalizedUrl);
    this.state = { instanceUrl: normalizedUrl };
    return true;
  }

  getInstanceUrl(): string | undefined {
    return this.state.instanceUrl;
  }
}
