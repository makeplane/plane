/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Keep resources adjacent to the package entry in both source and built output.
// This also works on Windows checkouts without filesystem symlink support.
export const loadLocale = (language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`);
