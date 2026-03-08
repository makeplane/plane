/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TCommandPaletteActionList = Record<string, { title: string; description: string; action: () => void }>;

export type TCommandPaletteShortcutList = {
  key: string;
  title: string;
  shortcuts: TCommandPaletteShortcut[];
};

export type TCommandPaletteShortcut = {
  keys: string; // comma separated keys
  description: string;
};
