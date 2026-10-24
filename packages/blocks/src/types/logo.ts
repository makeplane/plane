/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type Logo = {
  in_use: "emoji" | "icon" | "image";
  emoji?: {
    value?: string;
    url?: string;
  };
  icon?: {
    name?: string;
    color?: string;
    background_color?: string;
  };
  /** Image logo; `url` is an `http(s):` URL or a Plane asset path (`/api/assets/...`). */
  image?: {
    url?: string;
  };
};

/** @deprecated Use Logo instead. */
export type TLogoProps = Logo;
