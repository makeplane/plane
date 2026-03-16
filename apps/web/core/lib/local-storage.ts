/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEmpty } from "lodash-es";

export const storage = {
  set: (key: string, value: object | string | boolean): void => {
    if (typeof window === undefined || typeof window === "undefined" || !key || !value) return undefined;
    const tempValue: string | undefined = value
      ? ["string", "boolean"].includes(typeof value)
        ? value.toString()
        : isEmpty(value)
          ? undefined
          : JSON.stringify(value)
      : undefined;
    if (!tempValue) return undefined;
    window.localStorage.setItem(key, tempValue);
  },

  get: (key: string): string | undefined => {
    if (typeof window === undefined || typeof window === "undefined") return undefined;
    const item = window.localStorage.getItem(key);
    return item ? item : undefined;
  },

  remove: (key: string): void => {
    if (typeof window === undefined || typeof window === "undefined" || !key) return undefined;
    window.localStorage.removeItem(key);
  },
};
