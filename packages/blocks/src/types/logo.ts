/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type Logo = {
  in_use: "emoji" | "icon";
  emoji?: {
    value?: string;
    url?: string;
  };
  icon?: {
    name?: string;
    color?: string;
    background_color?: string;
  };
};

/** @deprecated Use Logo instead. */
export type TLogoProps = Logo;
