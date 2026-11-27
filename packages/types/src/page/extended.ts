/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TPageExtended = {
  // Liviere/plane fork: page view properties stored on the server; the fork keeps
  // "Block API changes" in `liviere_block_api`.
  view_props?: {
    liviere_block_api?: boolean;
    [key: string]: unknown;
  };
};
