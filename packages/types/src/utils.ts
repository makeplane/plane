/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type PartialDeep<K> = {
  [attr in keyof K]?: K[attr] extends object ? PartialDeep<K[attr]> : K[attr];
};

export type CompleteOrEmpty<T> = T | Record<string, never>;

export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type SingleOrArray<T> = T extends null | undefined ? T : T | T[];
